const levels = require("../src/models/level.js");

async function setXP(userID, guildID, xp) {
	if (!userID) throw new Error("[XP] User ID was not provided.");
	if (!guildID) throw new Error("[XP] Guild ID was not provided.");
	if (xp == null || isNaN(Number(xp))) throw new Error("[XP] Invalid XP amount.");

	const lvl = Math.floor(0.1 * Math.sqrt(xp));

	await levels.findOneAndUpdate(
		{ user: userID, guild: guildID },
		{ xp: xp, level: lvl },
		{ upsert: true }
	).catch((e) => console.log(`[XP] Failed to set XP | User: ${userID} | Err: ${e}`));

	return { xp };
}

module.exports = setXP;