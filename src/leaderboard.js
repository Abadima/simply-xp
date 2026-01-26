const levels = require("../src/models/level.js");
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
	const shouldPurge = Boolean(options?.auto_purge);
	const limitNumber = limit ? Number(limit) : null;

	function shortener(count) {
		const COUNT_ABBRS = ["", "k", "M", "T"];

		const i = 0 === count ? count : Math.floor(Math.log(count) / Math.log(1000));
		let result = parseFloat((count / Math.pow(1000, i)).toFixed(2));
		result += `${COUNT_ABBRS[i]}`;
		return result;
	}

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