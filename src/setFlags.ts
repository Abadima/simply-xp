import { XpFatal } from "./functions/xplogs";
import { db, xp } from "../xp";
import { UserResult } from "./functions/database";


/**
 * Flag a user, currently only supports "modified" and "illegal"
 * @param {string} userId
 * @param {string} guildId
 * @param {Array<number | string> | undefined} flags - "Undefined" will remove the flags
 * @param {string?} username - Username to use if auto_create is enabled
 */
export async function setFlags(userId: string, guildId: string, flags: Array<number | string> | undefined, username?: string): Promise<UserResult> {
	if (!userId) throw new XpFatal({ function: "flagUser()", message: "User ID was not provided" });
	if (!guildId) throw new XpFatal({ function: "flagUser()", message: "Guild ID was not provided" });
	if (flags && !Array.isArray(flags)) throw new XpFatal({
		function: "flagUser()", message: "Flags must be an array of numbers or strings"
	});

	const user = await db.findOne({ collection: "simply-xps", data: { user: userId, guild: guildId } }) as UserResult;

	if (!user) {
		// TODO: GET RID OF THIS CONSOLE LOG
		console.log("FLAGS => NO USER FOUND LMAO");
		if (xp.auto_create && username) return await db.createOne({
			collection: "simply-xps",
			data: {
				flags, guild: guildId, user: userId, name: username, level: 0, xp: 0, xp_rate: xp.xp_rate
			}
		}) as UserResult;
		else throw new XpFatal({ function: "setLevel()", message: "User does not exist" });
	} else {
		return await db.updateOne({
			collection: "simply-xps",
			data: { user: userId, guild: guildId }
		}, {
			collection: "simply-xps",
			data: { flags, guild: guildId, user: userId, level: user.level, xp: user.xp, xp_rate: xp.xp_rate }
		}) as UserResult;
	}
}