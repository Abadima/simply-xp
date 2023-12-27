import { XpEvents, XpFatal } from "./functions/xplogs";
import { UserResult } from "./functions/database";
import { convertFrom, db, roleSetup, xp } from "../xp";
import { XPResult } from "./add";

/**
 * Set user level
 * @async
 * @param {string} userId
 * @param {string} guildId
 * @param {number} level
 * @param {string} username - Username to use if auto_create is enabled
 * @link `Documentation:` https://simplyxp.js.org/docs/next/functions/setlevel
 * @returns {Promise<UserResult>} - Object of user data on success
 * @throws {XpFatal} - If parameters are not provided correctly
 */

export async function setLevel(userId: string, guildId: string, level: number, username?: string): Promise<UserResult> {
	if (!userId) throw new XpFatal({ function: "setLevel()", message: "User ID was not provided" });
	if (!guildId) throw new XpFatal({ function: "setLevel()", message: "Guild ID was not provided" });
	if (isNaN(level)) throw new XpFatal({ function: "setLevel()", message: "Level was not provided" });

	const user = await db.findOne({ collection: "simply-xps", data: { user: userId, guild: guildId } });

	if (!user) {
		if (xp.auto_create && username) return await db.createOne({
			collection: "simply-xps",
			data: {
				guild: guildId, user: userId, name: username, level, xp: convertFrom(level), xp_rate: xp.xp_rate
			}
		}) as UserResult;
		else throw new XpFatal({ function: "setLevel()", message: "User does not exist" });
	} else {
		return await db.updateOne({
			collection: "simply-xps",
			data: { user: userId, guild: guildId }
		}, {
			collection: "simply-xps",
			data: {
				user: userId, guild: guildId, level, xp: convertFrom(level), xp_rate: xp.xp_rate
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
 * @link `Documentation:` https://simplyxp.js.org/docs/next/functions/setxp
 * @returns {Promise<XPResult>} - Object of user data on success
 * @throws {XpFatal} - If parameters are not provided correctly
 */

export async function setXP(userId: string, guildId: string, xpData: number, username?: string): Promise<XPResult> {
	if (!userId) throw new XpFatal({ function: "setXP()", message: "User ID was not provided" });
	if (!guildId) throw new XpFatal({ function: "setXP()", message: "Guild ID was not provided" });
	if (isNaN(xpData)) throw new XpFatal({ function: "setXP()", message: "XP was not provided" });

	const user = await db.findOne({ collection: "simply-xps", data: { user: userId, guild: guildId } }) as UserResult;
	let data;

	if (!user) {
		if (xp.auto_create && username) data = await db.createOne({
			collection: "simply-xps",
			data: {
				guild: guildId, user: userId, name: username,
				level: convertFrom(xpData), xp: xpData, xp_rate: xp.xp_rate
			}
		}) as UserResult;
		else throw new XpFatal({ function: "setXP()", message: "User does not exist" });
	} else {
		data = await db.updateOne({
			collection: "simply-xps",
			data: { user: userId, guild: guildId }
		}, {
			collection: "simply-xps",
			data: {
				name: username || user?.name || userId,
				user: userId, guild: guildId, level: convertFrom(xpData),
				xp: xpData, xp_rate: xp.xp_rate
			}
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