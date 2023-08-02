import {XpFatal} from "./functions/xplogs";
import {convert} from "./functions/convert";
import {db} from "./functions/database";

/**
 * Set user level
 * @async
 * @param {string} userId
 * @param {string} guildId
 * @param {number} level
 * @link `Documentation:` https://simplyxp.js.org/docs/setlevel
 * @returns {Promise<{user: string, guild: string, level: number, xp: number}>} - Object of user data on success
 * @throws {XpFatal} - If parameters are not provided correctly
 */

export async function setLevel(userId: string, guildId: string, level: number): Promise<{
	user: string,
	guild: string,
	level: number,
	xp: number
}> {
	if (!userId) throw new XpFatal({function: "setLevel()", message: "User ID was not provided"});
	if (!guildId) throw new XpFatal({function: "setLevel()", message: "Guild ID was not provided"});
	if (!level) throw new XpFatal({function: "setLevel()", message: "Level was not provided"});

	const user = await db.findOne({collection: "simply-xps", data: {user: userId, guild: guildId}});

	if (!user) {
		return await db.createOne({
			collection: "simply-xps", data: {
				user: userId, guild: guildId,
				level, xp: convert("level", level)
			}
		}) as { user: string, guild: string, level: number, xp: number };
	} else {
		return await db.updateOne({
			collection: "simply-xps",
			data: {user: userId, guild: guildId,}
		}, {
			collection: "simply-xps",
			data: {
				user: userId, guild: guildId,
				level, xp: convert("level", level)
			}
		}) as { user: string, guild: string, level: number, xp: number };
	}
}


/**
 * Set user XP
 * @async
 * @param {string} userId
 * @param {string} guildId
 * @param {number} xp
 * @link `Documentation:` https://simplyxp.js.org/docs/setxp
 * @returns {Promise<object>} - Object of user data on success
 * @throws {XpFatal} - If parameters are not provided correctly
 */

export async function setXP(userId: string, guildId: string, xp: number): Promise<{
	user: string,
	guild: string,
	level: number,
	xp: number
}> {
	if (!userId) throw new XpFatal({function: "setXP()", message: "User ID was not provided"});
	if (!guildId) throw new XpFatal({function: "setXP()", message: "Guild ID was not provided"});
	if (!xp) throw new XpFatal({function: "setXP()", message: "XP was not provided"});

	const user = await db.findOne({collection: "simply-xps", data: {user: userId, guild: guildId}});

	if (!user) {
		return await db.createOne({
			collection: "simply-xps",
			data: {
				user: userId, guild: guildId,
				level: convert("xp", xp), xp
			}
		}) as { user: string, guild: string, level: number, xp: number };
	} else {
		return await db.updateOne({
			collection: "simply-xps",
			data: {user: userId, guild: guildId}
		}, {
			collection: "simply-xps",
			data: {
				user: userId, guild: guildId,
				level: convert("xp", xp), xp
			}
		}) as { user: string, guild: string, level: number, xp: number };
	}
}