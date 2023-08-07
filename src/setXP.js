const levels = require("../src/models/level.js");

async function setXP(userID, guildID, xp) {
	if (!userID) throw new Error("[XP] User ID was not provided.");
	if (!guildID) throw new Error("[XP] Guild ID was not provided.");
	if (!xp || isNaN(Number(xp))) throw new Error("[XP] Invalid XP amount.");

	const user = await levels.findOneAndUpdate(
		{user: userID, guild: guildID},
		{xp: xp},
		{upsert: true}
	);

	const lvl = Math.floor(0.1 * Math.sqrt(xp));
	if (user.level !== lvl) {
		user.level = lvl;
		await user.save().catch((e) => console.log(`[XP] Failed to set XP | User: ${userID} | Err: ${e}`));
	}

	return {xp};
}

module.exports = setXP;