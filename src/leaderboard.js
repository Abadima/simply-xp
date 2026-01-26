const levels = require("../src/models/level.js");
const shortener = require("./utils/shortener");
const { options } = require("../simplyxp");

/**
 * @param {Discord.Client} client
 * @param {string} guildID
 * @param {number?} limit
 */

async function leaderboard(client, guildID, limit) {
	if (!guildID) throw new Error("[XP] Guild ID was not provided.");

	let g = client.guilds.cache.get(guildID);
	if (!g) throw new Error("[XP] Guild was not found.");

	const leaderboard = await levels
		.find({ guild: guildID })
		.sort([["xp", "descending"]]);

	const led = [];
	let subtractPos = 0;
	let entryIndex = 0;
	const shouldPurge = Boolean(options?.auto_purge);
	const limitNumber = limit ? Number(limit) : null;

	for (const rawEntry of leaderboard) {
		entryIndex += 1;
		if (!rawEntry || typeof rawEntry !== "object") {
			continue;
		}
		const { guild: entryGuildID, user: userID, xp, level } =
			typeof rawEntry.toObject === "function" ? rawEntry.toObject() : rawEntry;
		const member = await g.members.fetch(userID).catch(() => null);
		if (!member && shouldPurge) {
			await levels.deleteOne({ user: userID, guild: entryGuildID });
		}
		if (xp === 0 || !member) {
			subtractPos += 1;
			continue;
		}

		const pos = entryIndex - subtractPos;
		if (limitNumber && pos > limitNumber) {
			if (!shouldPurge) break;
			continue;
		}

		led.push({
			guildID: entryGuildID,
			userID,
			xp,
			shortxp: shortener(xp),
			level,
			position: pos,
			username: member.user.username,
			tag: member.user.tag
		});
	}

	return led;
}

module.exports = leaderboard;