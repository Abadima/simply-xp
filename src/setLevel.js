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
	if (level == null || isNaN(Number(level))) throw new Error("[XP] Invalid level amount.");

	// Coerce level to number for consistent comparison
	const newLevel = Number(level);

	// Get the previous user document to capture the old level
	const previousUser = await levels.findOne({ user: userID, guild: guildID });
	const previousLevel = previousUser ? previousUser.level : 0;

	const user = await levels.findOneAndUpdate(
		{ user: userID, guild: guildID },
		{ xp: (newLevel * 10) ** 2, level: Math.floor(0.1 * Math.sqrt((newLevel * 10) ** 2)) },
		{ upsert: true, new: true }
	);

	// Compare previous level with new level to determine if levelUp should be emitted
	if (previousLevel !== user.level) {
		const data = buildLevelPayload(user, userID, guildID);

		await notifyLevelUp(message, data, user.level);
	}

	return {
		level: user.level,
		xp: user.xp
	};
}

module.exports = setLevel;