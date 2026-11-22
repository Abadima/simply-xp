// Shared by the test files: output formatting, fake Discord objects, and generated images (no network, no binary assets).
const { performance } = require("perf_hooks");

let depth = 0;
const indent = () => "  ".repeat(depth);
const took = (startedAt) => `${(performance.now() - startedAt).toFixed(1)}ms`;

async function runGroup(name, callback) {
	const startedAt = performance.now();
	console.log(`${indent()}▶ ${name}`);
	depth += 1;
	try {
		await callback();
	} finally {
		depth -= 1;
	}
	console.log(`${indent()}✔ ${name} (${took(startedAt)})`);
}

async function runCase(name, callback) {
	const startedAt = performance.now();
	try {
		const detail = await callback();
		console.log(`${indent()}✔ ${name}${detail ? ` → ${detail}` : ""} (${took(startedAt)})`);
	} catch (error) {
		console.log(`${indent()}✖ ${name} (${took(startedAt)})`);
		throw error;
	}
}

const skip = (name, why) => console.log(`${indent()}○ ${name} (skipped: ${why})`);

const kilobytes = (buffer) => `${(buffer.length / 1024).toFixed(1)} kB`;

/** A small avatar and a wide background, drawn on the fly. */
function makeImages() {
	const Canvas = require("@napi-rs/canvas");

	const avatar = Canvas.createCanvas(256, 256);
	let ctx = avatar.getContext("2d");
	const face = ctx.createLinearGradient(0, 0, 256, 256);
	face.addColorStop(0, "#ffb347");
	face.addColorStop(1, "#ff5e62");
	ctx.fillStyle = face;
	ctx.fillRect(0, 0, 256, 256);
	ctx.fillStyle = "#ffffff";
	ctx.beginPath();
	ctx.arc(128, 100, 44, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillRect(68, 160, 120, 96);

	const background = Canvas.createCanvas(1200, 500);
	ctx = background.getContext("2d");
	const sky = ctx.createLinearGradient(0, 0, 1200, 500);
	sky.addColorStop(0, "#5b2a86");
	sky.addColorStop(1, "#1fa2ff");
	ctx.fillStyle = sky;
	ctx.fillRect(0, 0, 1200, 500);

	return { avatar: avatar.toBuffer("image/png"), background: background.toBuffer("image/png") };
}

class Collection extends Map {
	find(predicate) {
		for (const value of this.values()) if (predicate(value)) return value;
	}
}

/**
 * Just enough of discord.js for the library: a client, a guild with members and roles, and a message.
 * `fetch` rejects like Discord does for somebody who left (code 10007); ids in `flaky` fail like an outage.
 */
function makeDiscord({ guildId, guildName = "Test Guild", memberIds = [], roleIds = [], avatar }) {
	const events = [];
	const roleAdds = [];
	const sent = [];
	const flaky = new Set();

	const members = new Collection();
	for (const id of memberIds) {
		members.set(id, {
			id,
			user: { username: `name-${id}`, tag: `name-${id}#0001`, displayAvatarURL: () => avatar },
			roles: { add: async (role) => roleAdds.push({ member: id, role: role.id }) }
		});
	}
	const roles = new Collection(roleIds.map((id) => [id, { id }]));

	const guild = {
		id: guildId,
		name: guildName,
		roles: { cache: roles },
		members: {
			cache: members,
			fetch: async (id) => {
				if (flaky.has(id)) throw Object.assign(new Error("Request timed out"), { code: "ETIMEDOUT" });
				if (members.has(id)) return members.get(id);
				throw Object.assign(new Error("Unknown Member"), { code: 10007 });
			}
		}
	};
	const client = {
		guilds: { cache: new Collection([[guildId, guild]]) },
		emit: (name, message, data, role) => events.push({ name, data, role })
	};
	const message = { client, guild, channel: { send: async (text) => sent.push(text) } };

	return { client, guild, message, events, roleAdds, sent, flaky };
}

module.exports = { runGroup, runCase, skip, kilobytes, makeImages, makeDiscord };
