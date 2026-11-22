const changeXP = require("./core/progress");
const { xpForLevel } = require("./core/curve");
const { requireIds, requireAmount } = require("./core/validate");

/**
 * @param {import("discord.js").Message} message
 * @param {string} userID
 * @param {string} guildID
 * @param {number|string} level
 */
async function setLevel(message, userID, guildID, level) {
	requireIds(userID, guildID);
	const target = requireAmount(level, "level");

	return changeXP(message, userID, guildID, () => xpForLevel(target));
}

module.exports = setLevel;
