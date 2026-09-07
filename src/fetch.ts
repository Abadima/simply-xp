import { requireGuildId, requireUserId } from "./functions/guards";
import { Database, UserResult } from "./classes/Database";
import { XpFatal } from "./functions/xplogs";
import { xp, type User } from "./client";
import { create } from "./create";

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
	requireUserId("fetch()", userId);
	requireGuildId("fetch()", guildId);

	let user = await Database.findOne({ collection: "simply-xps", data: { guild: guildId, user: userId } }) as UserResult | null;

	if (!user) {
		if (xp.auto_create && username) {
			user = await create(userId, guildId, username);
		} else throw new XpFatal({ function: "fetch()", message: "User data not found" });
	}

	const position = 1 + await Database.countUsersWithMoreXp(guildId, user.xp);
	return {
		flags: Array.isArray(user.flags) ? user.flags : [], guild: user.guild,
		user: user.user, name: user?.name,
		level: user.level, position,
		xp: user.xp
	};
}
