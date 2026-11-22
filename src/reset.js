const store = require("./core/store");
const { requireIds } = require("./core/validate");

/**
 * @param {string} userID
 * @param {string} guildID
 */
async function reset(userID, guildID) {
	requireIds(userID, guildID);

	if (await store.find(userID, guildID)) await store.write(userID, guildID, 0);
	return { user: userID, guild: guildID, xp: 0, level: 0 };
}

module.exports = reset;
