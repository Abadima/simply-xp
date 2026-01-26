const levels = require("../src/models/level.js");
const notifyLevelUp = require("./utils/levelUpNotifier");
const buildLevelPayload = require("./utils/levelPayload");

/**
 * @param {Discord.Message} message
 * @param {string} userID
 * @param {string} guildID
 * @param {string} level
 */
async function setLevel(message, userID, guildID, level) {
	if (!userID) throw new Error("[XP] User ID was not provided.");
	if (!guildID) throw new Error("[XP] Guild ID was not provided.");
	if (!level || isNaN(Number(level))) throw new Error("[XP] Invalid level amount.");

	const { client } = message;

	const user = await levels.findOneAndUpdate(
		{ user: userID, guild: guildID },
		{ xp: (level * 10) ** 2, level: Math.floor(0.1 * Math.sqrt((level * 10) ** 2)) },
		{ upsert: true, new: true }
	);

	if (user.level !== level) {
		const data = buildLevelPayload(user, userID, guildID);

		await notifyLevelUp(message, data, level);
	}

	return {
		level: user.level,
		xp: user.xp
	};
}

module.exports = setLevel;