import { mutateUserLevelAtomic, mutateUserXpAtomic, resolveXpInput, fireLevelEvents } from "./functions/mutations";
import { requireFiniteNumber, requireGuildId, requireUserId } from "./functions/guards";
import { UserResult } from "./classes/Database";
import { XPResult } from "./add";
import { xp } from "../xp";

/**
 * Add XP to a user
 * @async
 * @param {string} userId
 * @param {string} guildId
 * @param {number} level
 * @param {string} username - Username to use if auto_create is enabled
 * @link `Documentation:` https://simplyxp.js.org/docs/functions/addlevel
 * @returns {Promise<UserResult>} - Object of user data on success
 * @throws {XpFatal} - If parameters are not provided correctly
 */

export async function removeLevel(userId: string, guildId: string, level: number, username?: string): Promise<UserResult> {
	requireUserId("removeLevel()", userId);
	requireGuildId("removeLevel()", guildId);
	requireFiniteNumber("removeLevel()", level, "Level was not provided");

	const { current, previous } = await mutateUserLevelAtomic({
		createIfMissing: Boolean(xp.auto_create && username),
		guildId,
		mode: "delta",
		userId,
		username,
		value: -Math.floor(level),
	});

	await fireLevelEvents(current, previous, userId, guildId);
	return current;
}

/**
 * Add XP to a user.
 * @async
 * @param {string} userId - The ID of the user.
 * @param {string} guildId - The ID of the guild.
 * @param {number | {min: number, max: number}} xpData - The XP delta to remove. Values are negated internally, so passing negative values intentionally increases XP.
 * @param {string} username - Username to use if auto_create is enabled.
 * @link `Documentation:` https://simplyxp.js.org/docs/functions/addxp
 * @returns {Promise<XPResult>} - Object of user data on success.
 * @throws {XpFatal} - If parameters are not provided correctly.
 */
export async function removeXP(userId: string, guildId: string, xpData: number | {
	min: number, max: number
}, username?: string): Promise<XPResult> {
	requireUserId("removeXP()", userId);
	requireGuildId("removeXP()", guildId);

	const resolvedXp = resolveXpInput("removeXP()", xpData);
	const { current, previous } = await mutateUserXpAtomic({
		createIfMissing: Boolean(xp.auto_create && username),
		guildId,
		mode: "delta",
		userId,
		username,
		value: -resolvedXp,
	});

	const levelDifference = await fireLevelEvents(current, previous, userId, guildId);
	return { ...current, levelDifference };
}
