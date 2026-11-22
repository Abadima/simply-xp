function requireGuildID(guildID) {
	if (!guildID) throw new Error("[XP] Guild ID was not provided.");
}

function requireIds(userID, guildID) {
	if (!userID) throw new Error("[XP] User ID was not provided.");
	requireGuildID(guildID);
}

/** The value as a finite number, else throws `Invalid ${what} amount`. */
function requireAmount(value, what) {
	const amount = Number(value);
	if (value == null || !Number.isFinite(amount)) throw new Error(`[XP] Invalid ${what} amount.`);
	return amount;
}

function cachedGuild(client, guildID) {
	const guild = client.guilds.cache.get(guildID);
	if (!guild) throw new Error("[XP] Guild was not found.");
	return guild;
}

function cachedMember(guild, userID) {
	const member = guild.members.cache.get(userID);
	if (!member) throw new Error("[XP] Member not found or not cached.");
	return member;
}

module.exports = { requireGuildID, requireIds, requireAmount, cachedGuild, cachedMember };
