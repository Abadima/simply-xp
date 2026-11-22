import { changeUser, resolveXpInput } from "./functions/mutations";
import { requireFiniteNumber, requireIds } from "./functions/guards";
import type { UserResult, XPResult } from "./classes/Database";

/**
 * Add levels to a user
 * @async
 * @param {string} userId
 * @param {string} guildId
 * @param {number} level - Levels to add. Negative values remove levels.
 * @param {string} username - Username to use if auto_create is enabled
 * @link `Documentation:` https://simplyxp.js.org/docs/functions/addlevel
 * @returns {Promise<UserResult>} - Object of user data on success
 * @throws {XpFatal} - If parameters are not provided correctly
 */
export async function addLevel(userId: string, guildId: string, level: number, username?: string): Promise<UserResult> {
	requireIds("addLevel()", userId, guildId);
	requireFiniteNumber("addLevel()", level, "Level was not provided");

	return (await changeUser({ field: "level", guildId, mode: "delta", userId, username, value: Math.floor(level) })).current;
}

/**
 * Add XP to a user.
 * @async
 * @param {string} userId - The ID of the user.
 * @param {string} guildId - The ID of the guild.
 * @param {number | {min: number, max: number}} xpData - The XP delta to apply. Negative values are allowed and intentionally reduce XP.
 * @param {string} username - Username to use if auto_create is enabled.
 * @link `Documentation:` https://simplyxp.js.org/docs/functions/addxp
 * @returns {Promise<XPResult>} - Object of user data on success.
 * @throws {XpFatal} - If parameters are not provided correctly.
 */
export async function addXP(userId: string, guildId: string, xpData: number | {
	min: number, max: number
}, username?: string): Promise<XPResult> {
	requireIds("addXP()", userId, guildId);

	const { current, levelDifference } = await changeUser({
		field: "xp", guildId, mode: "delta", userId, username, value: resolveXpInput("addXP()", xpData)
	});
	return { ...current, levelDifference };
}
