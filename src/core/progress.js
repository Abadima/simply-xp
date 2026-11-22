const roleSetup = require("../roleSetup");
const store = require("./store");

/** Applies `change` to the user's XP and emits `levelUp` if their level changed. */
async function changeXP(message, userID, guildID, change) {
	const { client } = message;
	const { xp, level, previousLevel } = await store.adjust(userID, guildID, change);

	if (level !== previousLevel) {
		const role = await roleSetup.find(client, guildID, level);
		client.emit("levelUp", message, { xp, level, userID, guildID }, role);
	}

	return { level, xp };
}

module.exports = changeXP;
