import {XpFatal} from "./functions/xplogs";
import {db} from "./functions/database";

/**
 * User object
 * @property {string} guild - Guild ID
 * @property {string} user - User ID
 * @property {string} name - Username
 * @property {number} position - Position in leaderboard
 * @property {number} level - User level
 * @property {number} xp - User XP
 */
export interface 	User {
	guild: string;
	user: string;
	name?: string | null;
	position: number;
	level: number;
	xp: number;
}

/**
 * Get array of all users in the leaderboard
 * @async
 * @param {string} guildId - Guild ID
 * @param {number} limit - Limit of users to return
 * @link `Documentation:` https://simplyxp.js.org/docs/next/functions/leaderboard
 * @returns {Promise<User[]>} Array of all users in the leaderboard
 * @throws {XpFatal} If guild ID is not provided or limit is less than 1
 */
export async function leaderboard(guildId: string, limit?: number): Promise<User[]> {
	if (!guildId) throw new XpFatal({function: "leaderboard()", message: "Guild ID was not provided"});
	if (limit && !(limit >= 1)) throw new XpFatal({
		function: "leaderboard()", message: "Limit must be a number greater than 0"
	});

	const users = (await db.find({
		collection: "simply-xps", data: {guild: guildId}
	}) as Array<User>).sort((a, b) => b.xp - a.xp);


	await Promise.all(users.map(async (user, index) => {
		user.position = index + 1;
		return user;
	}));

	return users.slice(0, limit);
}