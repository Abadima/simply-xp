const levels = require("../src/models/level.js");
const shortener = require("./utils/shortener");
const { options } = require("../simplyxp");

/**
 * @param {Discord.Client} client
 * @param {string} guildID
 * @param {number?} limit
 */

async function leaderboard(client, guildID, limit) {
	if (!guildID) throw new Error("[XP] Guild ID was not provided.");

	let g = client.guilds.cache.get(guildID);
	if (!g) throw new Error("[XP] Guild was not found.");

	const leaderboard = await levels
		.find({ guild: guildID })
		.sort([["xp", "descending"]]);

	const led = [];
	let subtractPos = 0;
	let entryIndex = 0;
	const shouldPurge = Boolean(options?.auto_purge);
	const limitNumber = limit ? Number(limit) : null;

	// Fetch all members concurrently to avoid sequential awaits in the loop
	const entriesWithMembers = await Promise.all(
		leaderboard.map(async (rawEntry) => {
			if (!rawEntry || typeof rawEntry !== "object") {
				return { rawEntry: null, member: null };
			}

			const normalizedEntry =
				typeof rawEntry.toObject === "function" ? rawEntry.toObject() : rawEntry;

			const { user: userID } = normalizedEntry;
			let member = null;
			if (userID) {
				member = await g.members.fetch(userID).catch(() => null);
			}

			return { rawEntry: normalizedEntry, member };
		})
	);

	// Collect entries to purge for batch deletion
	const entriesToPurge = [];

	for (const entry of entriesWithMembers) {
		entryIndex += 1;

		const { rawEntry, member } = entry;
		if (!rawEntry) {
			continue;
		}

		const { guild: entryGuildID, user: userID, xp, level } = rawEntry;
		if (!member && shouldPurge) {
			entriesToPurge.push({ user: userID, guild: entryGuildID });
		}
		if (xp === 0 || !member) {
			subtractPos += 1;
			continue;
		}

		const pos = entryIndex - subtractPos;
		if (limitNumber && pos > limitNumber) {
			if (!shouldPurge) break;
			continue;
		}

		led.push({
			guildID: entryGuildID,
			userID,
			xp,
			shortxp: shortener(xp),
			level,
			position: pos,
			username: member.user.username,
			tag: member.user.tag
		});
	}

	// Batch delete purged entries
	if (entriesToPurge.length > 0) {
		await levels.deleteMany({
			$or: entriesToPurge
		});
	}

	return led;
}

module.exports = leaderboard;