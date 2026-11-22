const changeXP = require("./core/progress");
const { xpForLevel } = require("./core/curve");
const { requireIds, requireAmount } = require("./core/validate");

/**
 * @param {import("discord.js").Message} message
 * @param {string} userID
 * @param {string} guildID
 * @param {number|string} level
 */
async function addLevel(message, userID, guildID, level) {
	requireIds(userID, guildID);
	const levelsToAdd = requireAmount(level, "level");

	return changeXP(message, userID, guildID, ({ level: current }) => xpForLevel(current + levelsToAdd));
}

module.exports = addLevel;
