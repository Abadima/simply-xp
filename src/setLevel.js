const levels = require("../src/models/level.js");
const {roleSetup} = require("../simplyxp");

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

	const {client} = message;

	const user = await levels.findOneAndUpdate(
		{user: userID, guild: guildID},
		{xp: (level * 10) ** 2, level: Math.floor(0.1 * Math.sqrt((level * 10) ** 2))},
		{upsert: true, new: true}
	);

	if (user.level !== level) {
		let data = {
			xp: user.xp,
			level: user.level,
			userID,
			guildID
		};

		let role = await roleSetup.find(client, guildID, level);

		client.emit("levelUp", message, data, role);
	}

	return {
		level: user.level,
		xp: user.xp
	};
}

module.exports = setLevel;