const store = require("./core/store");
const roleSetup = require("./roleSetup");
const { requireIds, cachedMember } = require("./core/validate");

/**
 * @param {import("discord.js").Message} message
 * @param {string} userID
 * @param {string} guildID
 */
async function lvlRole(message, userID, guildID) {
	requireIds(userID, guildID);

	const progress = await store.find(userID, guildID);
	if (!progress) {
		// As in 1.3.x: a new user is recorded and earns nothing yet.
		await store.ensure(userID, guildID);
		return;
	}

	const entries = (await roleSetup.fetch(message.client, guildID)) ?? [];
	const earned = entries.filter(({ lvl }) => progress.level >= Number(lvl));

	if (earned.length === 0) return;
	const member = cachedMember(message.guild, userID);

	for (const { role } of earned) {
		const guildRole = message.guild.roles.cache.get(role);
		if (!guildRole) continue;

		member.roles.add(guildRole).catch(() => {
			message.channel.send("[XP] ERROR: Role is higher than me. `MISSING_PERMISSIONS`");
		});
	}
}

module.exports = lvlRole;
