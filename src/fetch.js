const levels = require("../src/models/level.js");
const getUserPosition = require("./utils/getUserPosition");
const shortener = require("./utils/shortener");

/**
 * @param {string} userID
 * @param {string} guildID
 */

async function fetch(userID, guildID) {
	if (!userID) throw new Error("[XP] User ID was not provided.");

	if (!guildID) throw new Error("[XP] Guild ID was not provided.");

	let user = await levels.findOne({
		user: userID,
		guild: guildID
	});
	if (!user) {
		user = new levels({
			user: userID,
			guild: guildID,
			xp: 0,
			level: 0
		});

		await user.save();
	}

	user.position = (await getUserPosition(userID, guildID)) || 1;

	let targetxp = user.level + 1;

	let target = targetxp * targetxp * 100;

	let shortXP = shortener(user.xp);

	let shortReqXP = shortener(target);

	return {
		level: user.level,
		xp: user.xp,
		reqxp: target,
		rank: user.position,
		shortxp: shortXP,
		shortreq: shortReqXP
	};
}

module.exports = fetch;
