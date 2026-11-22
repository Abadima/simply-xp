const store = require("./store");
const { xpForLevel } = require("./curve");

/** A user's level and XP, the XP the next level needs, and their guild rank. */
async function standing(userID, guildID, { xp, level }) {
	return { level, xp, reqxp: xpForLevel(level + 1), rank: await store.positionOf(userID, guildID) };
}

module.exports = standing;
