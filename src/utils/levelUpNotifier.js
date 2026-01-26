const { roleSetup } = require("../simplyxp");

async function notifyLevelUp(message, data, roleLevel) {
	const role = await roleSetup.find(message.client, data.guildID, roleLevel);
	message.client.emit("levelUp", message, data, role);
}

module.exports = notifyLevelUp;
