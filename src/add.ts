import {convert} from "./functions/convert";
import {XpFatal} from "./functions/xplogs";
import {db} from "./functions/database";

/**
 * Add XP to a user
 * @async
 * @param {string} userId
 * @param {string} guildId
 * @param {number} level
 * @link `Documentation:` https://simplyxp.js.org/docs/addlevel
 * @returns {Promise<{user: string, guild: string, level: number, xp: number}>} - Object of user data on success
 * @throws {XpFatal} - If parameters are not provided correctly
 */

export async function addLevel(userId: string, guildId: string, level: number): Promise<{
	user: string,
	guild: string,
	level: number,
	xp: number
}> {
	if (!userId) throw new XpFatal({function: "addLevel()", message: "User ID was not provided"});

	if (!guildId) throw new XpFatal({function: "addLevel()", message: "Guild ID was not provided"});

	if (!level) throw new XpFatal({function: "addLevel()", message: "Level was not provided"});

	const user = await db.findOne({
		collection: "simply-xps", data: {user: userId, guild: guildId}
	}) as { user: string, guild: string, level: number, xp: number };

	if (!user) {
		return await db.createOne({
			collection: "simply-xps",
			data: {
				user: userId, guild: guildId,
				level, xp: convert("level", level)
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
				level: user.level + level,
				xp: convert("level", level + user.level)
			}
		}) as { user: string, guild: string, level: number, xp: number };
	}
}


/**
 * Add XP to a user.
 * @async
 * @param {string} userId - The ID of the user.
 * @param {string} guildId - The ID of the guild.
 * @param {number | {min: number, max: number}} xp - The XP to add, can be a number or an object with min and max properties.
 * @link `Documentation:` https://simplyxp.js.org/docs/addxp
 * @returns {Promise<{user: string, guild: string, level: number, xp: number}>} - Object of user data on success.
 * @throws {XpFatal} - If parameters are not provided correctly.
 */
export async function addXP(userId: string, guildId: string, xp: number | { min: number, max: number }): Promise<{
	user: string,
	guild: string,
	level: number,
	xp: number
}> {
	if (typeof xp !== "number" && (typeof xp !== "object" || !xp.min || !xp.max)) throw new XpFatal({
		function: "addXP()", message: "XP is not a number or object, make sure you are using the correct syntax"
	});

	if (typeof xp === "object") xp = Math.floor(Math.random() * (xp.max - xp.min) + xp.min);

	if (!userId) throw new XpFatal({function: "addXP()", message: "User ID was not provided"});

	if (!guildId) throw new XpFatal({function: "addXP()", message: "Guild ID was not provided"});

	const user = await db.findOne({
		collection: "simply-xps", data: {user: userId, guild: guildId}
	}) as { user: string, guild: string, level: number, xp: number };

	if (!user) {
		return await db.createOne({
			collection: "simply-xps",
			data: {
				user: userId, guild:
				guildId, level: convert("xp", xp), xp
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
				level: convert("xp", user.xp + xp),
				xp: user.xp + xp
			}
		}) as { user: string, guild: string, level: number, xp: number };
	}
}