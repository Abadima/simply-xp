const levels = require("../src/models/level.js");
const { options } = require("../simplyxp");
const shortener = require("./utils/shortener");

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
	const shouldPurge = Boolean(options?.auto_purge);
	const limitNumber = limit ? Number(limit) : null;

	for (let i = 0; i < leaderboard.length; i += 1) {
		const key = leaderboard[i];
		const user = await g.members.fetch(key.user).catch(() => null);
		if (!user && shouldPurge) {
			await levels.deleteOne({ user: key.user, guild: guildID });
		}
		if (key.xp === 0 || !user) {
			subtractPos += 1;
			continue;
		}

		const pos = i + 1 - subtractPos;
		if (limitNumber && pos > limitNumber) {
			if (!shouldPurge) break;
			continue;
		}

		led.push({
			guildID: key.guild,
			userID: key.user,
			xp: key.xp,
			shortxp: shortener(key.xp),
			level: key.level,
			position: pos,
			username: user.user.username,
			tag: user.user.tag
		});
	}

	return led;
}

module.exports = leaderboard;