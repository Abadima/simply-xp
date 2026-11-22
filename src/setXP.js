const store = require("./core/store");
const { requireIds, requireAmount } = require("./core/validate");

/**
 * @param {string} userID
 * @param {string} guildID
 * @param {number|string} xp
 */
async function setXP(userID, guildID, xp) {
	requireIds(userID, guildID);
	const total = requireAmount(xp, "XP");

	const { xp: stored, level } = await store.write(userID, guildID, total);
	return { xp: stored, level };
}

module.exports = setXP;
