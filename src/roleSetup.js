const database = require("./core/database");
const { cachedGuild } = require("./core/validate");

const roles = () => database.collection("simply-xp-levelroles");

const keyOf = (guildID) => ({ gid: String(guildID) });

const sameLevel = (a, b) => String(a) === String(b);

/** Entries from every document of the guild; older versions could leave several. */
async function entriesOf(guildID) {
	const collection = await roles();
	const documents = await collection.find(keyOf(guildID)).toArray();
	if (documents.length > 0) return documents.flatMap((document) => document.lvlrole ?? []);
}

class roleSetup {
	/**
	 * @param {import("discord.js").Client} client
	 * @param {string} guildID
	 * @param {import("../index").lvladdOptions} options
	 */
	static async add(client, guildID, options = {}) {
		const { level, role } = options;

		if (!cachedGuild(client, guildID).roles.cache.has(role)) {
			throw new Error("Role ID is invalid. | " + `Guild ID: ${guildID} | Role ID: ${role}`);
		}

		const existing = (await entriesOf(guildID)) ?? [];
		if (existing.some((entry) => entry.lvl === level && entry.role === role)) {
			throw new Error("Level Already Exist. Use delete");
		}

		const collection = await roles();
		await collection.updateOne(keyOf(guildID), { $push: { lvlrole: { lvl: level, role } } }, { upsert: true });

		return true;
	}

	/**
	 * Removes every role set for the level.
	 * @param {import("discord.js").Client} client Unused.
	 * @param {string} guildID
	 * @param {import("../index").lvlremoveOptions} options
	 */
	static async remove(client, guildID, options = {}) {
		const matches = ((await entriesOf(guildID)) ?? []).filter((entry) => sameLevel(entry.lvl, options.level));
		if (matches.length === 0) throw new Error("Level role with this level does not exist");

		const collection = await roles();
		await collection.updateMany(keyOf(guildID), {
			$pull: { lvlrole: { lvl: { $in: matches.map((entry) => entry.lvl) } } }
		});

		return true;
	}

	/**
	 * @param {import("discord.js").Client} client Unused.
	 * @param {string} guildID
	 * @returns {Promise<{lvl: string|number, role: string}[]|undefined>}
	 */
	static async fetch(client, guildID) {
		return entriesOf(guildID);
	}

	/**
	 * @param {import("discord.js").Client} client Unused.
	 * @param {string} guildID
	 * @param {string|number} level
	 * @returns {Promise<{lvl: string|number, role: string}[]|undefined>}
	 */
	static async find(client, guildID, level) {
		const entries = await entriesOf(guildID);
		return entries?.filter((entry) => sameLevel(entry.lvl, level));
	}
}

module.exports = roleSetup;
