const store = require("./core/store");
const standing = require("./core/standing");
const { requireIds, cachedMember } = require("./core/validate");
const renderRankCard = require("./rankCard");

/**
 * Resolves `undefined` (and logs) when the card can't be drawn.
 * @param {import("discord.js").Message} message
 * @param {string} userID
 * @param {string} guildID
 * @param {import("../index").rankOptions} options
 */
async function rank(message, userID, guildID, options = {}) {
	requireIds(userID, guildID);

	const record = await store.find(userID, guildID);
	if (!record) throw new Error("[XP] NO_DATA | User has no XP data.");

	const progress = await standing(userID, guildID, record);

	try {
		const { user } = cachedMember(message.guild, userID);
		return await renderRankCard({ ...progress, user, guildName: message.guild.name }, options);
	} catch (error) {
		console.log(`[XP] Error Occured. | rankCard | Error: ${error.stack}`);
	}
}

module.exports = rank;
