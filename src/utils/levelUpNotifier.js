const { roleSetup } = require("../../simplyxp");

/**
 * Emits the shared level-up event using the configured role setup.
 * @param {Discord.Message} message
 * @param {Object} data
 * @param {number|string} roleLevel
 * @returns {Promise<void>}
 */
async function notifyLevelUp(message, data, roleLevel) {
    const role = await roleSetup.find(message.client, data.guildID, roleLevel);
    message.client.emit("levelUp", message, data, role);
}

module.exports = notifyLevelUp;
