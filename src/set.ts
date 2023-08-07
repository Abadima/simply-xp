import {XpFatal} from "./functions/xplogs";
import {convert} from "./functions/utilities";
import {db, UserResult} from "./functions/database";
import {xp} from "../xp";

/**
 * Set user level
 * @async
 * @param {string} userId
 * @param {string} guildId
 * @param {number} level
 * @param {string} username - Username to use if auto_create is enabled
 * @link `Documentation:` https://simplyxp.js.org/docs/setlevel
 * @returns {Promise<UserResult>} - Object of user data on success
 * @throws {XpFatal} - If parameters are not provided correctly
 */

export async function setLevel(userId: string, guildId: string, level: number, username?: string): Promise<UserResult> {
	if (!userId) throw new XpFatal({function: "setLevel()", message: "User ID was not provided"});
	if (!guildId) throw new XpFatal({function: "setLevel()", message: "Guild ID was not provided"});
	if (!level) throw new XpFatal({function: "setLevel()", message: "Level was not provided"});

	const user = await db.findOne({collection: "simply-xps", data: {user: userId, guild: guildId}});

	if (!user) {
		if (xp.auto_create && username) return await db.createOne({
			collection: "simply-xps",
			data: {
				guild: guildId, user: userId, name: username, level, xp: convert("level", level)
			}
		}) as UserResult;
		else throw new XpFatal({function: "setLevel()", message: "User does not exist"});
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
		}) as UserResult;
	}
}


/**
 * Set user XP
 * @async
 * @param {string} userId
 * @param {string} guildId
 * @param {number} xpData
 * @param {string} username - Username to use if auto_create is enabled
 * @link `Documentation:` https://simplyxp.js.org/docs/setxp
 * @returns {Promise<UserResult>} - Object of user data on success
 * @throws {XpFatal} - If parameters are not provided correctly
 */

export async function setXP(userId: string, guildId: string, xpData: number, username?: string): Promise<UserResult> {
	if (!userId) throw new XpFatal({function: "setXP()", message: "User ID was not provided"});
	if (!guildId) throw new XpFatal({function: "setXP()", message: "Guild ID was not provided"});
	if (!xpData) throw new XpFatal({function: "setXP()", message: "XP was not provided"});

	const user = await db.findOne({collection: "simply-xps", data: {user: userId, guild: guildId}});

	if (!user) {
		if (xp.auto_create && username) return await db.createOne({
			collection: "simply-xps",
			data: {
				guild: guildId, user: userId, name: username, level: convert("xp", xpData), xp: xpData
			}
		}) as UserResult;
		else throw new XpFatal({function: "setXP()", message: "User does not exist"});
	} else {
		return await db.updateOne({
			collection: "simply-xps",
			data: {user: userId, guild: guildId}
		}, {
			collection: "simply-xps",
			data: {
				user: userId, guild: guildId,
				level: convert("xp", xpData), xp: xpData
			}
		}) as UserResult;
	}
}