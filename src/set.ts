import { mutateUserLevelAtomic, mutateUserXpAtomic, fireLevelEvents } from "./functions/mutations";
import { requireFiniteNumber, requireGuildId, requireUserId } from "./functions/guards";
import { UserResult } from "./classes/Database";
import { XpFatal } from "./functions/xplogs";
import { XPResult } from "./add";
import { xp } from "./client";

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
	requireUserId("setLevel()", userId);
	requireGuildId("setLevel()", guildId);
	requireFiniteNumber("setLevel()", level, "Level was not provided");

	const normalizedLevel = Math.max(0, Math.floor(level));
	const { current, previous } = await mutateUserLevelAtomic({
		createIfMissing: Boolean(xp.auto_create && username),
		guildId,
		mode: "set",
		userId,
		username,
		value: normalizedLevel,
	});

	if (!current) throw new XpFatal({ function: "setLevel()", message: "User does not exist" });
	await fireLevelEvents(current, previous, userId, guildId);
	return current;
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
	requireUserId("setXP()", userId);
	requireGuildId("setXP()", guildId);
	requireFiniteNumber("setXP()", xpData, "XP was not provided");

	const normalizedXp = Math.max(0, Math.floor(xpData));
	const { current, previous } = await mutateUserXpAtomic({
		createIfMissing: Boolean(xp.auto_create && username),
		guildId,
		mode: "set",
		userId,
		username,
		value: normalizedXp,
	});

	const levelDifference = await fireLevelEvents(current, previous, userId, guildId);
	return { ...current, levelDifference };
}