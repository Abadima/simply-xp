import { changeUser } from "./functions/mutations";
import { requireFiniteNumber, requireIds } from "./functions/guards";
import type { UserResult, XPResult } from "./classes/Database";

/**
 * Set user level
 * @async
 * @param {string} userId
 * @param {string} guildId
 * @param {number} level
 * @param {string} username - Username to use if auto_create is enabled
 * @link `Documentation:` https://simplyxp.js.org/docs/functions/setlevel
 * @returns {Promise<UserResult>} - Object of user data on success
 * @throws {XpFatal} - If parameters are not provided correctly
 */
export async function setLevel(userId: string, guildId: string, level: number, username?: string): Promise<UserResult> {
	requireIds("setLevel()", userId, guildId);
	requireFiniteNumber("setLevel()", level, "Level was not provided");

	return (await changeUser({ field: "level", guildId, mode: "set", userId, username, value: Math.max(0, Math.floor(level)) })).current;
}

/**
 * Set user XP
 * @async
 * @param {string} userId
 * @param {string} guildId
 * @param {number} xpData
 * @param {string} username - Username to use if auto_create is enabled
 * @link `Documentation:` https://simplyxp.js.org/docs/functions/setxp
 * @returns {Promise<XPResult>} - Object of user data on success
 * @throws {XpFatal} - If parameters are not provided correctly
 */
export async function setXP(userId: string, guildId: string, xpData: number, username?: string): Promise<XPResult> {
	requireIds("setXP()", userId, guildId);
	requireFiniteNumber("setXP()", xpData, "XP was not provided");

	const { current, levelDifference } = await changeUser({
		field: "xp", guildId, mode: "set", userId, username, value: Math.max(0, Math.floor(xpData))
	});
	return { ...current, levelDifference };
}
