const store = require("./core/store");
const options = require("./core/options");
const shortener = require("./core/shortener");
const { requireGuildID, cachedGuild } = require("./core/validate");

const UNKNOWN_MEMBER = 10007;
const UNKNOWN_USER = 10013;

/** `left` is set only when Discord says the member is gone, not when the lookup failed. */
async function fetchMember(guild, userID) {
	if (!userID) return {};

	try {
		return { member: await guild.members.fetch(userID) };
	} catch (error) {
		return { left: [UNKNOWN_MEMBER, UNKNOWN_USER].includes(error.code) };
	}
}

/**
 * Ranks members with XP; `auto_purge` deletes the records of members who left.
 * @param {import("discord.js").Client} client
 * @param {string} guildID
 * @param {number?} limit
 */
async function leaderboard(client, guildID, limit) {
	requireGuildID(guildID);
	const guild = cachedGuild(client, guildID);

	const records = await store.listByXP(guildID);
	const fetched = await Promise.all(
		records.map(async (record) => ({ record, ...(await fetchMember(guild, record.userID)) }))
	);

	const maxEntries = Number(limit) || Infinity;
	const board = [];
	const departed = [];

	fetched.forEach(({ record, member, left }) => {
		if (!member) {
			if (left && options.auto_purge) departed.push(record);
			return;
		}
		if (record.xp === 0 || board.length + 1 > maxEntries) return;

		board.push({
			guildID: record.guildID,
			userID: record.userID,
			xp: record.xp,
			shortxp: shortener(record.xp),
			level: record.level,
			position: board.length + 1,
			username: member.user.username,
			tag: member.user.tag
		});
	});

	if (departed.length > 0) await store.remove(departed);

	return board;
}

module.exports = leaderboard;
