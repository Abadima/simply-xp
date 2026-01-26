const levels = require("../models/level.js");

/**
 * Walks the sorted leaderboard for a guild to discover a user's global position.
 * @param {string} userID
 * @param {string} guildID
 * @returns {Promise<number|null>}
 */
async function getUserPosition(userID, guildID) {
	const cursor = levels.find({ guild: guildID }).sort({ xp: -1 }).cursor();
	let position = 0;

	try {
		for await (const entry of cursor) {
			position += 1;
			if (entry.user === userID) {
				return position;
			}
		}
		return null;
	} finally {
		if (typeof cursor.close === "function") {
			await cursor.close();
		}
	}
}

module.exports = getUserPosition;