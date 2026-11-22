const store = require("./core/store");
const { requireIds } = require("./core/validate");

/**
 * @param {string} userID
 * @param {string} guildID
 * @returns {Promise<true|undefined>} `true` if the user was created.
 */
async function create(userID, guildID) {
	requireIds(userID, guildID);

	const { created } = await store.ensure(userID, guildID);
	if (created) return true;
}

module.exports = create;
