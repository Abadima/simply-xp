import { Database, UserResult } from "./classes/Database";
import { canAutoCreate, requireIds } from "./functions/guards";
import { findUser } from "./functions/users";
import { XpFatal } from "./functions/xplogs";
import { xp } from "./client";

/**
 * Set a user's flags.
 * @param {string} userId
 * @param {string} guildId
 * @param {Array<number | string> | undefined} flags - "Undefined" will remove the flags
 * @param {string?} username - Username to use if auto_create is enabled
 */
export async function setFlags(userId: string, guildId: string, flags: Array<number | string> | undefined, username?: string): Promise<UserResult> {
	requireIds("setFlags()", userId, guildId);
	if (flags !== undefined && !Array.isArray(flags)) throw new XpFatal({
		function: "setFlags()", message: "Flags must be an array of numbers or strings"
	});

	const normalizedFlags = flags ?? [];
	const user = await findUser(guildId, userId);

	if (!user) {
		if (!canAutoCreate(username)) throw new XpFatal({ function: "setFlags()", message: "User does not exist" });

		return await Database.createOne({
			collection: "simply-xps",
			data: { flags: normalizedFlags, guild: guildId, user: userId, name: username, level: 0, xp: 0, xp_rate: xp.xp_rate }
		}) as UserResult;
	}

	const updated = await Database.updateOne({
		collection: "simply-xps",
		data: { user: userId, guild: guildId }
	}, {
		collection: "simply-xps",
		data: { flags: normalizedFlags, guild: guildId, user: userId, level: user.level, xp: user.xp, xp_rate: xp.xp_rate }
	}) as UserResult | null;

	if (!updated) throw new XpFatal({ function: "setFlags()", message: "User does not exist" });
	return updated;
}
