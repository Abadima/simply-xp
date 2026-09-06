import { XpFatal } from "./functions/xplogs";
import { Database, User } from "../xp";

/**
 * Get array of all users in the leaderboard
 * @async
 * @param {string?} guildId - Guild ID (optional)
 * @param {number} limit - Limit of users to return
 * @link `Documentation:` https://simplyxp.js.org/docs/functions/leaderboard
 * @returns {Promise<User[]>} Array of all users in the leaderboard
 * @throws {XpFatal} If guild ID is not provided or limit is less than 1
 */
export async function leaderboard(guildId?: string, limit?: number): Promise<User[]> {
	if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
		throw new XpFatal({ function: "leaderboard()", message: "Limit must be an integer greater than 0" });
	}

	let users: User[];

	if (guildId) {
		users = await Database.find("simply-xps", guildId, limit) as User[];
		if (!limit) users = users.sort(compareLeaderboardUsers);
	} else {
		users = await Database.findGlobalLeaderboard(limit) as User[];
	}

	const rankedUsers = users.slice(0, limit);
	let previousXp: number | null = null;
	let currentPosition = 0;

	return rankedUsers.map((user, index) => {
		if (previousXp === null || user.xp < previousXp) currentPosition = index + 1;
		previousXp = user.xp;
		user.position = currentPosition;
		return user;
	});
}

function compareLeaderboardUsers(left: User, right: User): number {
	return right.xp - left.xp;
}