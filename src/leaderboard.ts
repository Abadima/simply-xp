import { XpFatal } from "./functions/xplogs";
import { db, User } from "../xp";

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

	let users: Array<User>;
	const userIds: Set<string> = new Set<string>();

	if (guildId) users = (await db.find({
		collection: "simply-xps", data: { guild: guildId }
	}) as Array<User>).sort((a, b) => b.xp - a.xp);
	else users = (await db.findAll("simply-xps") as Array<User>).sort((a, b) => b.xp - a.xp).filter((user) => {
		if (userIds.has(user.user)) return false;
		userIds.add(user.user);
		return true;
	});

	await Promise.all(users.map(async (user, index) => {
		user.position = index + 1;
		return user;
	}));

	return users.slice(0, limit);
}