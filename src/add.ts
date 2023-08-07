import {convert} from "./functions/utilities";
import {XpFatal} from "./functions/xplogs";
import {db, UserResult} from "./functions/database";
import {xp} from "../xp";

/**
 * Add XP to a user
 * @async
 * @param {string} userId
 * @param {string} guildId
 * @param {number} level
 * @param {string} username - Username to use if auto_create is enabled
 * @link `Documentation:` https://simplyxp.js.org/docs/addlevel
 * @returns {Promise<UserResult>} - Object of user data on success
 * @throws {XpFatal} - If parameters are not provided correctly
 */

export async function addLevel(userId: string, guildId: string, level: number, username?: string): Promise<UserResult> {
	if (!userId) throw new XpFatal({function: "addLevel()", message: "User ID was not provided"});

	if (!guildId) throw new XpFatal({function: "addLevel()", message: "Guild ID was not provided"});

	if (!level) throw new XpFatal({function: "addLevel()", message: "Level was not provided"});

	const user = await db.findOne({
		collection: "simply-xps", data: {user: userId, guild: guildId}
	}) as UserResult;

	if (!user) {
		if (xp.auto_create && username) return await db.createOne({
			collection: "simply-xps",
			data: {
				guild: guildId, user: userId, name: username, level, xp: convert("level", level)
			}
		}) as UserResult;
		else throw new XpFatal({function: "addLevel()", message: "User does not exist"});
	} else {
		return await db.updateOne({
			collection: "simply-xps",
			data: {user: userId, guild: guildId}
		}, {
			collection: "simply-xps",
			data: {
				user: userId, guild: guildId,
				level: user.level + level,
				xp: convert("level", level + user.level)
			}
		}) as UserResult;
	}
}


/**
 * Add XP to a user.
 * @async
 * @param {string} userId - The ID of the user.
 * @param {string} guildId - The ID of the guild.
 * @param {number | {min: number, max: number}} xpData - The XP to add, can be a number or an object with min and max properties.
 * @param {string} username - Username to use if auto_create is enabled.
 * @link `Documentation:` https://simplyxp.js.org/docs/addxp
 * @returns {Promise<UserResult>} - Object of user data on success.
 * @throws {XpFatal} - If parameters are not provided correctly.
 */
export async function addXP(userId: string, guildId: string, xpData: number | { min: number, max: number }, username?: string): Promise<UserResult> {
	if (typeof xpData !== "number" && (typeof xp !== "object" || !xpData.min || !xpData.max)) throw new XpFatal({
		function: "addXP()", message: "XP is not a number or object, make sure you are using the correct syntax"
	});

	if (typeof xpData === "object") xpData = Math.floor(Math.random() * (xpData.max - xpData.min) + xpData.min);

	if (!userId) throw new XpFatal({function: "addXP()", message: "User ID was not provided"});

	if (!guildId) throw new XpFatal({function: "addXP()", message: "Guild ID was not provided"});

	const user = await db.findOne({
		collection: "simply-xps", data: {user: userId, guild: guildId}
	}) as UserResult;

	if (!user) {
		if (xp.auto_create && username) return await db.createOne({
			collection: "simply-xps",
			data: {
				guild: guildId, user: userId, name: username, level: convert("xp", xpData), xp: xpData
			}
		}) as UserResult;
		else throw new XpFatal({function: "addXP()", message: "User does not exist"});
	} else {
		return await db.updateOne({
			collection: "simply-xps",
			data: {user: userId, guild: guildId}
		}, {
			collection: "simply-xps",
			data: {
				user: userId, guild: guildId,
				level: convert("xp", user.xp + xpData),
				xp: user.xp + xpData
			}
		}) as UserResult;
	}
}