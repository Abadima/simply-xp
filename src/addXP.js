const changeXP = require("./core/progress");
const { requireIds, requireAmount } = require("./core/validate");

function rangeBound(value, name) {
	const bound = Number(value);
	if (!Number.isFinite(bound)) throw new Error(`[XP] XP amount (${name}) is not a number.`);
	return bound;
}

/** A whole number; for a range, random from `min` up to but not including `max`. */
function resolveAmount(xp) {
	const { min, max } = xp ?? {};

	if (min == null && max == null) return Math.trunc(requireAmount(xp, "XP"));

	if (max == null) throw new Error("[XP] XP min amount is provided but max amount is not provided.");
	if (min == null) throw new Error("[XP] XP max amount is provided but min amount is not provided.");

	const low = rangeBound(min, "min");
	const high = rangeBound(max, "max");

	return Math.floor(Math.random() * (high - low) + low);
}

/**
 * @param {import("discord.js").Message} message
 * @param {string} userID
 * @param {string} guildID
 * @param {number|{min: number, max: number}} xp
 */
async function addXP(message, userID, guildID, xp) {
	requireIds(userID, guildID);
	const amount = resolveAmount(xp);

	return changeXP(message, userID, guildID, ({ xp: current }) => current + amount);
}

module.exports = addXP;
