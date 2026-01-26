import { XpFatal } from "./functions/xplogs";
import { Database, User } from "../xp";

/**
 * Get array of all users in the leaderboard
 * @async
 * @param {string?} guildId - Guild ID (optional)
 * @param {number} limit - Limit of users to return
 * @link `Documentation:` https://simplyxp.js.org/docs/next/functions/leaderboard
 * @returns {Promise<User[]>} Array of all users in the leaderboard
 * @throws {XpFatal} If guild ID is not provided or limit is less than 1
 */
export async function leaderboard(guildId?: string, limit?: number): Promise<User[]> {
	if (limit && !(limit >= 1)) throw new XpFatal({
		function: "leaderboard()", message: "Limit must be a number greater than 0"
	});

	let users: User[];

	if (guildId) {
		users = (await Database.find("simply-xps", guildId) as User[]).sort((a, b) => b.xp - a.xp);
	} else {
		users = await Database.findAll("simply-xps") as User[];

		const userMap = new Map<string, User>();
		for (const user of users) {
			const existing = userMap.get(user.user);
			if (!existing || user.xp > existing.xp) {
				userMap.set(user.user, user);
			}
		}

		users = Array.from(userMap.values()).sort((a, b) => b.xp - a.xp);
	}

	return users.slice(0, limit).map((user, index) => ({
		...user, position: index + 1
	}));
}