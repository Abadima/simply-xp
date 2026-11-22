import { changeUser, resolveXpInput } from "./functions/mutations";
import { requireFiniteNumber, requireIds } from "./functions/guards";
import type { UserResult, XPResult } from "./classes/Database";

/**
 * Remove levels from a user
 * @async
 * @param {string} userId
 * @param {string} guildId
 * @param {number} level - Levels to remove. Negative values add levels.
 * @param {string} username - Username to use if auto_create is enabled
 * @link `Documentation:` https://simplyxp.js.org/docs/functions/removelevel
 * @returns {Promise<UserResult>} - Object of user data on success
 * @throws {XpFatal} - If parameters are not provided correctly
 */
export async function removeLevel(userId: string, guildId: string, level: number, username?: string): Promise<UserResult> {
	requireIds("removeLevel()", userId, guildId);
	requireFiniteNumber("removeLevel()", level, "Level was not provided");

	return (await changeUser({ field: "level", guildId, mode: "delta", userId, username, value: -Math.floor(level) })).current;
}

/**
 * Remove XP from a user.
 * @async
 * @param {string} userId - The ID of the user.
 * @param {string} guildId - The ID of the guild.
 * @param {number | {min: number, max: number}} xpData - The XP delta to remove. Values are negated internally, so passing negative values intentionally increases XP.
 * @param {string} username - Username to use if auto_create is enabled.
 * @link `Documentation:` https://simplyxp.js.org/docs/functions/removexp
 * @returns {Promise<XPResult>} - Object of user data on success.
 * @throws {XpFatal} - If parameters are not provided correctly.
 */
export async function removeXP(userId: string, guildId: string, xpData: number | {
	min: number, max: number
}, username?: string): Promise<XPResult> {
	requireIds("removeXP()", userId, guildId);

	const { current, levelDifference } = await changeUser({
		field: "xp", guildId, mode: "delta", userId, username, value: -resolveXpInput("removeXP()", xpData)
	});
	return { ...current, levelDifference };
}
