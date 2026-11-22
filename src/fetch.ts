import { findOrCreateUser, positionOf } from "./functions/users";
import { requireIds } from "./functions/guards";
import { XpFatal } from "./functions/xplogs";
import type { User } from "./client";

/**
 * Fetch user data
 * @async
 * @param {string} userId
 * @param {string} guildId
 * @param {string?} username - Username to use if auto_create is enabled
 * @link `Documentation:` https://simplyxp.js.org/docs/functions/fetch
 * @returns {Promise<{name: string | null, user: string, guild: string, level: number, position: number, xp: number}>}
 * @throws {XpFatal} If invalid parameters are provided, or if the user data is not found.
 */
export async function fetch(userId: string, guildId: string, username?: string): Promise<User> {
	requireIds("fetch()", userId, guildId);

	const user = await findOrCreateUser(guildId, userId, username);
	if (!user) throw new XpFatal({ function: "fetch()", message: "User data not found" });

	return {
		flags: Array.isArray(user.flags) ? user.flags : [], guild: user.guild,
		user: user.user, name: user.name,
		level: user.level, position: await positionOf(guildId, user.xp),
		xp: user.xp
	};
}
