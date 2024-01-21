import { XpEvents, XpFatal } from "./functions/xplogs";
import { UserResult } from "./functions/database";
import { convertFrom, db, roleSetup, xp } from "../xp";
import { XPResult } from "./add";

/**
 * Add XP to a user
 * @async
 * @param {string} userId
 * @param {string} guildId
 * @param {number} level
 * @param {string} username - Username to use if auto_create is enabled
 * @link `Documentation:` https://simplyxp.js.org/docs/next/functions/addlevel
 * @returns {Promise<UserResult>} - Object of user data on success
 * @throws {XpFatal} - If parameters are not provided correctly
 */

export async function removeLevel(userId: string, guildId: string, level: number, username?: string): Promise<UserResult> {
	if (!userId) throw new XpFatal({ function: "removeLevel()", message: "User ID was not provided" });

	if (!guildId) throw new XpFatal({ function: "removeLevel()", message: "Guild ID was not provided" });

	if (isNaN(level)) throw new XpFatal({ function: "removeLevel()", message: "Level was not provided" });

	const user = await db.findOne({
		collection: "simply-xps", data: { user: userId, guild: guildId }
	}) as UserResult;

	if (!user) {
		if (xp.auto_create && username) return await db.createOne({
			collection: "simply-xps",
			data: { guild: guildId, user: userId, name: username, level: 0, xp: 0, xp_rate: xp.xp_rate }
		}) as UserResult;
		else throw new XpFatal({ function: "removeLevel()", message: "User does not exist" });
	} else {
		return await db.updateOne({
			collection: "simply-xps",
			data: { user: userId, guild: guildId }
		}, {
			collection: "simply-xps",
			data: {
				name: username || user?.name || userId,
				user: userId, guild: guildId,
				level: user.level - level,
				xp: convertFrom(user.level - level),
				xp_rate: xp.xp_rate
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
 * @link `Documentation:` https://simplyxp.js.org/docs/next/functions/addxp
 * @returns {Promise<XPResult>} - Object of user data on success.
 * @throws {XpFatal} - If parameters are not provided correctly.
 */
export async function removeXP(userId: string, guildId: string, xpData: number | {
	min: number, max: number
}, username?: string): Promise<XPResult> {

	if (typeof xpData !== "number" && (typeof xp !== "object" || !xpData.min || !xpData.max)) throw new XpFatal({
		function: "addXP()", message: "XP is not a number or object, make sure you are using the correct syntax"
	});

	if (typeof xpData === "object") xpData = Math.floor(Math.random() * (xpData.max - xpData.min) + xpData.min);

	if (!userId) throw new XpFatal({ function: "removeXP()", message: "User ID was not provided" });

	if (!guildId) throw new XpFatal({ function: "removeXP()", message: "Guild ID was not provided" });

	const user = await db.findOne({
		collection: "simply-xps", data: { user: userId, guild: guildId }
	}) as UserResult;

	let data;

	if (!user) {
		if (xp.auto_create && username) data = await db.createOne({
			collection: "simply-xps",
			data: {
				guild: guildId, user: userId,
				name: username, level: 0,
				xp: 0, xp_rate: xp.xp_rate
			}
		}).catch((err) => {
			throw new XpFatal({ function: "removeXP()", message: err.stack });
		}) as UserResult;
		else throw new XpFatal({ function: "removeXP()", message: "User does not exist" });
	} else {
		data = await db.updateOne({
			collection: "simply-xps",
			data: { user: userId, guild: guildId }
		}, {
			collection: "simply-xps",
			data: {
				user: userId, guild: guildId, name: username || user?.name || userId,
				level: convertFrom(user.xp - xpData, "xp"),
				xp: user.xp - xpData,
				xp_rate: xp.xp_rate
			}
		}).catch((err) => {
			throw new XpFatal({ function: "removeXP()", message: err.stack });
		}) as UserResult;
	}

	const callback = XpEvents.eventCallback,
		levelDifference = (user?.level && data?.level) ? (data.level !== user.level ? (data.level - user.level) : 0) : (data?.level > 0 ? data.level : 0);

	if (levelDifference < 0 && callback?.levelDown && typeof callback.levelDown === "function") callback["levelDown"](data, await roleSetup.getRoles(userId, guildId, {
		includeNextRoles: true
	}));

	if (levelDifference > 0 && callback?.levelUp && typeof callback.levelUp === "function") callback["levelUp"](data, await roleSetup.getRoles(userId, guildId));
	return { ...data, levelDifference: levelDifference };
}