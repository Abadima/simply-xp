import {XpFatal} from "./functions/xplogs";
import {User} from "./leaderboard";
import {xp} from "../xp";

/**
 * Fetch user data
 * @async
 * @param {string} userId
 * @param {string} guildId
 * @param {string} username - Username to use if auto_create is enabled
 * @link `Documentation:` https://simplyxp.js.org/docs/fetch
 * @returns {Promise<{name: string | null, user: string, guild: string, level: number, position: number, xp: number}>}
 * @throws {XpFatal} If invalid parameters are provided, or if the user data is not found.
 */
export async function fetch(userId: string, guildId: string, username: string): Promise<User> {
	if (!userId) throw new XpFatal({function: "create()", message: "User ID was not provided"});
	if (!guildId) throw new XpFatal({function: "create()", message: "Guild ID was not provided"});

	const users: User[] = await (await import("./functions/database")).db.find({collection: "simply-xps", data: {guild: guildId}}) as User[];
	const user = users.find((u) => u.user === userId);

	if (!user) {
		if (xp.auto_create && username) return (await import("./create")).create(guildId, userId, username);
		throw new XpFatal({function: "fetch()", message: "User data not found"});
	}

	const position = users.sort((a, b) => b.xp - a.xp).findIndex((u) => u.user === userId) + 1;
	return {name: user?.name, user: user.user, guild: user.guild, level: user.level, position: position, xp: user.xp};
}