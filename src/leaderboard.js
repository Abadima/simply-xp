const levels = require("../src/models/level.js");
const {options} = require("../simplyxp");

/**
 * @param {Discord.Client} client
 * @param {string} guildID
 * @param {number?} limit
 */

async function leaderboard(client, guildID, limit) {
	if (!guildID) throw new Error("[XP] Guild ID was not provided.");

	let g = client.guilds.cache.get(guildID);
	if (!g) throw new Error("[XP] Guild was not found.");

	let leaderboard = await levels.find({guild: guildID}).sort([["xp", "descending"]]);

	let led = [];

	function shortener(count) {
		const COUNT_ABBRS = ["", "k", "M", "T"];

		const i = 0 === count ? count : Math.floor(Math.log(count) / Math.log(1000));
		let result = parseFloat((count / Math.pow(1000, i)).toFixed(2));
		result += `${COUNT_ABBRS[i]}`;
		return result;
	}

	const led2 = leaderboard.map(async (key) => {
		const user = await g.members.fetch(key.user).catch(() => null);
		if (!user && options.auto_purge) return levels.deleteOne({user: key.user, guild: guildID});
		if (key.xp === 0) return;

		let pos = leaderboard.indexOf(key) + 1;
		if (limit && pos > Number(limit)) return;

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
	});
	return Promise.all(led2).then(() => led);
}

module.exports = leaderboard;