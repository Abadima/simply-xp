const store = require("./core/store");
const standing = require("./core/standing");
const { requireIds } = require("./core/validate");
const shortener = require("./core/shortener");

/**
 * @param {string} userID
 * @param {string} guildID
 */
async function fetch(userID, guildID) {
	requireIds(userID, guildID);

	const record = await store.ensure(userID, guildID);
	const progress = await standing(userID, guildID, record);

	return {
		...progress,
		shortxp: shortener(progress.xp),
		shortreq: shortener(progress.reqxp)
	};
}

module.exports = fetch;
