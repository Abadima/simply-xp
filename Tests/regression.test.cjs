// Behavior the package has to keep. The first groups need nothing; the database groups need a MongoDB:
// set MONGODB_URI, or put `module.exports = { MongoURI: "mongodb://..." }` in a git-ignored secrets.cjs.
// It only touches documents of guilds named "xp-test-*", and removes them afterwards.
const assert = require("assert");
const { existsSync } = require("fs");
const { join } = require("path");
const { pathToFileURL } = require("url");
const { execFileSync } = require("child_process");
const { MongoClient } = require("mongodb");
const { runGroup, runCase, skip, makeImages, makeDiscord } = require("./helpers.cjs");
const xp = require("../simplyxp");
const shortener = require("../src/core/shortener");

const secrets = join(__dirname, "..", "secrets.cjs");
const MONGO_URI = process.env.MONGODB_URI || (existsSync(secrets) ? require(secrets).MongoURI : null);
const { avatar, background } = makeImages();

let counter = 0;
const nextGuild = () => `xp-test-${(counter += 1)}`;
const discord = (extra = {}) =>
	makeDiscord({ guildId: nextGuild(), avatar, memberIds: ["u", "v", "w"], roleIds: ["r1", "r2"], ...extra });

async function withCleanDatabase(callback) {
	const probe = await MongoClient.connect(MONGO_URI);
	const clean = async () => {
		await probe
			.db()
			.collection("simply-xps")
			.deleteMany({ guild: /^xp-test-/ });
		await probe
			.db()
			.collection("simply-xp-levelroles")
			.deleteMany({ gid: /^xp-test-/ });
	};
	await clean();
	try {
		await callback(probe);
	} finally {
		await clean();
		await probe.close();
	}
}

async function run() {
	await runGroup("Public API", async () => {
		await runCase("exports the same functions as 1.3.x", async () => {
			const names =
				"addLevel addXP charts connect create fetch leaderboard lvlRole options rank reset roleSetup setLevel setXP";
			assert.deepStrictEqual(Object.keys(xp).sort(), names.split(" "));
			assert.deepStrictEqual({ ...xp.options }, { auto_purge: false });
		});

		await runCase("can be imported from an ES module, by name or as a whole", async () => {
			const entry = pathToFileURL(join(__dirname, "..", "simplyxp.js")).href;
			const code = [
				`import xp, { addXP, roleSetup, options } from ${JSON.stringify(entry)};`,
				`import * as everything from ${JSON.stringify(entry)};`,
				'if (addXP !== xp.addXP || everything.default !== xp || typeof roleSetup.add !== "function") throw new Error("mismatch");',
				'if (typeof options.auto_purge !== "boolean") throw new Error("options");'
			].join("\n");
			execFileSync(process.execPath, ["--input-type=module", "-e", code], { stdio: "pipe" });
		});

		await runCase("rejects missing ids and bad amounts before touching the database", async () => {
			const { message } = discord();
			await assert.rejects(() => xp.addXP(message, "", "g", 1), /User ID was not provided/);
			await assert.rejects(() => xp.fetch("u", ""), /Guild ID was not provided/);
			await assert.rejects(() => xp.addXP(message, "u", "g", "abc"), /Invalid XP amount/);
			await assert.rejects(() => xp.addLevel(message, "u", "g", null), /Invalid level amount/);
			await assert.rejects(() => xp.addXP(message, "u", "g", { min: 5 }), /min amount is provided but max/);
			await assert.rejects(() => xp.connect(), /Database URL was not provided/);
		});

		await runCase("shortens numbers the way 1.3.x did", async () => {
			const shown = [0, 400, 1500, 4900, 12345, 1e6, -1500, NaN].map(shortener);
			assert.deepStrictEqual(shown, ["0", "400", "1.5k", "4.9k", "12.35k", "1M", "-1.5k", "0"]);
		});
	});

	if (!MONGO_URI) {
		skip("Database flows", "set MONGODB_URI or create secrets.cjs");
		console.log("\n[REGRESSION] Database-free tests passed.");
		return;
	}

	await withCleanDatabase(async (probe) => {
		await xp.connect(MONGO_URI);
		const records = probe.db().collection("simply-xps");

		await runGroup("Connection", async () => {
			await runCase("connecting again to the same database is fine, to another one is refused", async () => {
				await xp.connect(MONGO_URI);
				await assert.rejects(() => xp.connect("mongodb://127.0.0.1:1/elsewhere"), /different database/);
			});

			await runCase("indexes allow one user in several guilds", async () => {
				const names = (await records.indexes()).map((index) => index.name);
				assert.ok(names.includes("user_1_guild_1"), "Expected the user+guild unique index");
				assert.ok(!names.includes("user_1"), "Expected the old one-guild-per-user index to be gone");
			});
		});

		await runGroup("XP and levels", async () => {
			await runCase("create() is true for a new user and undefined for an existing one", async () => {
				const { guild } = discord();
				assert.strictEqual(await xp.create("u", guild.id), true);
				assert.strictEqual(await xp.create("u", guild.id), undefined);
			});

			await runCase("fetch() creates a missing user and shows level, requirement and place", async () => {
				const { guild } = discord();
				assert.deepStrictEqual(await xp.fetch("u", guild.id), {
					level: 0,
					xp: 0,
					reqxp: 100,
					rank: 1,
					shortxp: "0",
					shortreq: "100"
				});
			});

			await runCase("setXP() stores the xp together with the level it implies", async () => {
				const { guild } = discord();
				assert.deepStrictEqual(await xp.setXP("u", guild.id, 450), { xp: 450, level: 2 });
				assert.strictEqual((await xp.fetch("u", guild.id)).reqxp, 900);
			});

			await runCase("addXP() levels up and emits levelUp with the roles of that level", async () => {
				const { message, guild, events } = discord();
				await xp.roleSetup.add(message.client, guild.id, { level: 1, role: "r1" });
				await xp.setXP("u", guild.id, 90);

				assert.deepStrictEqual(await xp.addXP(message, "u", guild.id, 20), { level: 1, xp: 110 });
				assert.deepStrictEqual(
					events.map((event) => event.name),
					["levelUp"]
				);
				assert.deepStrictEqual(events[0].data, { xp: 110, level: 1, userID: "u", guildID: guild.id });
				assert.deepStrictEqual(events[0].role, [{ lvl: 1, role: "r1" }]);
			});

			await runCase("addXP() for a brand-new user returns and stores the real result", async () => {
				const { message, guild } = discord();
				assert.deepStrictEqual(await xp.addXP(message, "u", guild.id, 150), { level: 1, xp: 150 });
				assert.strictEqual((await xp.fetch("u", guild.id)).xp, 150);
			});

			await runCase("addXP() takes a {min, max} range, max excluded", async () => {
				const { message, guild } = discord();
				const gains = [];
				for (let i = 0; i < 40; i += 1) {
					const before = (await xp.fetch("u", guild.id)).xp;
					gains.push((await xp.addXP(message, "u", guild.id, { min: 5, max: 8 })).xp - before);
				}
				assert.ok(
					gains.every((gain) => gain >= 5 && gain <= 7),
					`Gains out of range: ${gains}`
				);
				assert.ok(new Set(gains).size > 1, "Expected the amount to vary");
			});

			await runCase("setLevel() and addLevel() move to the xp of that level", async () => {
				const { message, guild } = discord();
				assert.deepStrictEqual(await xp.setLevel(message, "u", guild.id, 5), { level: 5, xp: 2500 });
				assert.deepStrictEqual(await xp.addLevel(message, "u", guild.id, 2), { level: 7, xp: 4900 });
			});

			await runCase("xp never drops below zero", async () => {
				const { message, guild } = discord();
				await xp.setXP("u", guild.id, 50);
				assert.deepStrictEqual(await xp.addXP(message, "u", guild.id, -999), { level: 0, xp: 0 });
			});

			await runCase("reset() zeroes a user but does not create an unknown one", async () => {
				const { message, guild } = discord();
				await xp.setXP("u", guild.id, 5000);
				assert.deepStrictEqual(await xp.reset("u", guild.id), { user: "u", guild: guild.id, xp: 0, level: 0 });
				assert.strictEqual((await xp.fetch("u", guild.id)).xp, 0);

				await xp.reset("nobody", guild.id);
				await assert.rejects(() => xp.rank(message, "nobody", guild.id), /NO_DATA/);
			});

			await runCase("simultaneous addXP() calls are all counted", async () => {
				const { message, guild } = discord();
				await Promise.all(Array.from({ length: 20 }, () => xp.addXP(message, "u", guild.id, 5)));
				assert.strictEqual((await xp.fetch("u", guild.id)).xp, 100);
			});

			await runCase("one user can have xp in several guilds", async () => {
				const first = discord();
				const second = discord();
				await xp.setXP("u", first.guild.id, 100);
				await xp.setXP("u", second.guild.id, 400);
				assert.strictEqual((await xp.fetch("u", first.guild.id)).xp, 100);
				assert.strictEqual((await xp.fetch("u", second.guild.id)).xp, 400);
			});
		});

		await runGroup("Level roles", async () => {
			await runCase("roleSetup adds, finds and removes roles, and refuses duplicates", async () => {
				const { client, guild } = discord();
				assert.strictEqual(await xp.roleSetup.fetch(client, guild.id), undefined);
				assert.strictEqual(await xp.roleSetup.add(client, guild.id, { level: 1, role: "r1" }), true);
				await xp.roleSetup.add(client, guild.id, { level: 1, role: "r2" });
				await assert.rejects(
					() => xp.roleSetup.add(client, guild.id, { level: 1, role: "r1" }),
					/Level Already Exist/
				);
				await assert.rejects(
					() => xp.roleSetup.add(client, guild.id, { level: 2, role: "nope" }),
					/Role ID is invalid/
				);

				assert.deepStrictEqual(await xp.roleSetup.find(client, guild.id, 1), [
					{ lvl: 1, role: "r1" },
					{ lvl: 1, role: "r2" }
				]);
				assert.strictEqual(await xp.roleSetup.remove(client, guild.id, { level: 1 }), true);
				assert.deepStrictEqual(await xp.roleSetup.fetch(client, guild.id), []);
				await assert.rejects(() => xp.roleSetup.remove(client, guild.id, { level: 1 }), /does not exist/);
			});

			await runCase("lvlRole() gives a user the roles they have earned, and only those", async () => {
				const { message, client, guild, roleAdds } = discord();
				await xp.roleSetup.add(client, guild.id, { level: 1, role: "r1" });
				await xp.roleSetup.add(client, guild.id, { level: 5, role: "r2" });
				await xp.setXP("u", guild.id, 150);

				await xp.lvlRole(message, "u", guild.id);
				assert.deepStrictEqual(roleAdds, [{ member: "u", role: "r1" }]);
			});

			await runCase("level roles listed in more than one document are all read", async () => {
				const { client, guild } = discord();
				await probe
					.db()
					.collection("simply-xp-levelroles")
					.insertMany([
						{ gid: guild.id, lvlrole: [{ lvl: 1, role: "r1" }] },
						{ gid: guild.id, lvlrole: [{ lvl: 2, role: "r2" }] }
					]);
				assert.strictEqual((await xp.roleSetup.fetch(client, guild.id)).length, 2);
			});
		});

		await runGroup("Leaderboard", async () => {
			await runCase("ranks by xp, leaves out zero xp and people who left, and honours the limit", async () => {
				const { client, guild } = discord();
				for (const [user, amount] of [
					["u", 300],
					["v", 900],
					["w", 0],
					["left", 5000]
				]) {
					await xp.create(user, guild.id);
					if (amount) await xp.setXP(user, guild.id, amount);
				}

				const board = await xp.leaderboard(client, guild.id);
				assert.deepStrictEqual(
					board.map((entry) => [entry.userID, entry.position, entry.xp]),
					[
						["v", 1, 900],
						["u", 2, 300]
					]
				);
				assert.strictEqual((await xp.leaderboard(client, guild.id, 1)).length, 1);
			});

			await runCase("auto_purge deletes members who left, not ones whose lookup merely failed", async () => {
				const { client, guild, flaky } = discord();
				for (const user of ["u", "left", "flaky"]) await xp.setXP(user, guild.id, 100);
				flaky.add("flaky");

				xp.options.auto_purge = true;
				try {
					await xp.leaderboard(client, guild.id);
				} finally {
					xp.options.auto_purge = false;
				}
				const kept = (await records.find({ guild: guild.id }).toArray()).map((record) => record.user).sort();
				assert.deepStrictEqual(kept, ["flaky", "u"]);
			});
		});

		await runGroup("Cards", async () => {
			await runCase("rank() draws a WebP card for a user with data", async () => {
				const { message, guild } = discord();
				await xp.setXP("u", guild.id, 1234);
				const card = await xp.rank(message, "u", guild.id, { background });
				assert.strictEqual(card.attachment.subarray(8, 12).toString(), "WEBP");
				assert.strictEqual(card.name, "rank.png");
			});

			await runCase(
				"rank() rejects without data, and resolves undefined when the card cannot be drawn",
				async () => {
					const { message, guild } = discord({ memberIds: [] });
					await assert.rejects(() => xp.rank(message, "u", guild.id), /NO_DATA/);
					await xp.setXP("u", guild.id, 100);

					const log = console.log;
					console.log = () => {};
					try {
						assert.strictEqual(await xp.rank(message, "u", guild.id), undefined);
					} finally {
						console.log = log;
					}
				}
			);

			await runCase("charts() draws a PNG from the leaderboard, with or without options", async () => {
				const { message, guild } = discord();
				for (const user of ["u", "v", "w"]) await xp.setXP(user, guild.id, 100 + user.charCodeAt(0));
				for (const options of [undefined, { type: "pie", position: 2 }]) {
					const chart = await xp.charts(message, options);
					assert.strictEqual(chart.name, "chart.png");
					assert.strictEqual(chart.attachment.subarray(1, 4).toString(), "PNG");
				}
			});
		});
	});

	console.log("\n[REGRESSION] All regression tests passed.");
}

run()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("[REGRESSION] Failure:", error);
		process.exit(1);
	});
