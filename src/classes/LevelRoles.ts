import { Database, LevelRoleOptions, LevelRoleResult } from "./Database";
import { requireGuildId, requireUserId, requireValue } from "../functions/guards";
import { findUser } from "../functions/users";
import { XpFatal } from "../functions/xplogs";

/**
 * Get Roles Object
 * @property {boolean} [includeCurrent=true] - Include roles for the current level
 * @property {boolean} [includeNext=false] - Include roles for the next levels
 * @property {boolean} [includePrevious=false] - Include roles for the previous levels
 */
type GetRolesOptions = {
	includeCurrent?: boolean; // Default: true
	includeNext?: boolean;
	includePrevious?: boolean;
}

/**
 * Role setup object
 * @property {number} level - The level number
 * @property {string[]} [roles] - Role IDs. Omit when deleting an entire level entry.
 */
export interface LevelRole {
	level: number;
	roles?: string[];
}

const levelRoleQuery = (guildId: string, level: number, roles?: string[]): LevelRoleOptions => ({
	collection: "simply-xp-levelroles",
	data: { guild: guildId, levelrole: roles ? { level, roles } : { level } }
});

const findLevelRole = (guildId: string, level: number): Promise<LevelRoleResult | null> =>
	Database.findOne(levelRoleQuery(guildId, level)) as Promise<LevelRoleResult | null>;

/** The checks `add()`, `delete()` and `set()` share. `delete()` takes `roles` only optionally. */
function requireLevelRole(functionName: string, guildId: string, options: LevelRole, rolesRequired: boolean): void {
	requireGuildId(functionName, guildId);
	requireValue(functionName, options, "Options were not provided");

	if (isNaN(options.level)) throw new XpFatal({ function: functionName, message: "Level must be a number" });

	const { roles } = options;
	const invalid = !Array.isArray(roles) || roles.length === 0;
	if (rolesRequired ? invalid : roles !== undefined && invalid) {
		throw new XpFatal({ function: functionName, message: "Roles must be a non-empty array of strings" });
	}
}

/**
 * Setup roles for levels
 * @class LevelRoles
 * @link `Documentation:` https://simplyxp.js.org/docs/classes/LevelRoles
 */
export class LevelRoles {
	/**
	 * Add a role to the role setup
	 * @async
	 * @param {string} guildId - The guild ID
	 * @param {LevelRole} options - Level and role to add
	 * @link `Documentation:` https://simplyxp.js.org/docs/classes/LevelRoles#levelrolesadd
	 * @returns {Promise<boolean>} - True if successful
	 * @throws {XpFatal} If an invalid type is provided or value is not provided, or if the database operation fails.
	 */
	static async add(guildId: string, options: LevelRole): Promise<boolean> {
		requireLevelRole("LevelRoles.add()", guildId, options, true);

		const existing = await findLevelRole(guildId, options.level);
		const roles = Array.from(new Set([...(existing?.levelrole.roles ?? []), ...(options.roles ?? [])]));

		return await Database.updateOne(levelRoleQuery(guildId, options.level), levelRoleQuery(guildId, options.level, roles), {
			upsert: true
		}).then(() => true);
	}

	/**
	 * Delete some or all roles from the level.
	 * @async
	 * @param {string} guildId - The guild ID
	 * @param {LevelRole} options - Level and/or roles to delete
	 * @link `Documentation:` https://simplyxp.js.org/docs/classes/LevelRoles#levelrolesdelete
	 * @returns {Promise<boolean>} - True if successful. False if there was nothing to delete.
	 * @throws {XpFatal} If an invalid type is provided or value is not provided, or if the database operation fails.
	 */
	static async delete(guildId: string, options: LevelRole): Promise<boolean> {
		requireLevelRole("LevelRoles.delete()", guildId, options, false);

		const existing = await findLevelRole(guildId, options.level);
		if (!existing) return false;

		const rolesToRemove = options.roles ?? [];
		const remaining = rolesToRemove.length > 0 ? (existing.levelrole.roles || []).filter((role) => !rolesToRemove.includes(role)) : [];

		if (remaining.length === 0) return await Database.deleteOne(levelRoleQuery(guildId, options.level));

		return await Database.updateOne(levelRoleQuery(guildId, options.level), levelRoleQuery(guildId, options.level, remaining))
			.then((result) => Boolean(result));
	}

	/**
	 * Delete all roles in a guild's role setup
	 * @async
	 * @param {string} guildId - The guild ID
	 * @link `Documentation:` https://simplyxp.js.org/docs/classes/LevelRoles#levelrolesdeleteall
	 * @returns {Promise<boolean>} - True if any level roles were deleted. False if the guild had none.
	 * @throws {XpFatal} If an invalid type is provided or value is not provided, or if the database operation fails.
	 */
	static async deleteAll(guildId: string): Promise<boolean> {
		requireGuildId("LevelRoles.deleteAll()", guildId);

		return await Database.deleteMany({
			collection: "simply-xp-levelroles",
			data: { guild: guildId }
		});
	}

	/**
	 * Fetch all roles in a guild's role setup
	 * @async
	 * @param {string} guildId - The guild ID
	 * @link `Documentation:` https://simplyxp.js.org/docs/classes/LevelRoles#levelrolesgetguildroles
	 * @returns {Promise<LevelRoleResult[]>} - Every level role set for the guild (empty when there are none)
	 * @throws {XpFatal} If the guild ID is not provided.
	 */
	static async getGuildRoles(guildId: string): Promise<LevelRoleResult[]> {
		requireGuildId("LevelRoles.getGuildRoles()", guildId);

		return await Database.find("simply-xp-levelroles", guildId) as LevelRoleResult[];
	}

	/**
	 * Get roles for a user's level
	 * @async
	 * @param {string} userId - The user ID
	 * @param {string} guildId - The guild ID
	 * @param {GetRolesOptions} options - Options
	 * @link `Documentation:` https://simplyxp.js.org/docs/classes/LevelRoles#getuserroles
	 * @returns {Promise<string[]>} - Array of role IDs or empty array if none
	 * @throws {XpFatal} If an invalid type is provided or value is not provided.
	 */
	static async getUserRoles(userId: string, guildId: string, options: GetRolesOptions = {}): Promise<string[]> {
		requireUserId("LevelRoles.getUserRoles()", userId);
		requireGuildId("LevelRoles.getUserRoles()", guildId);

		const user = await findUser(guildId, userId);

		if (!user?.level) return [];

		const allRoles = await LevelRoles.getGuildRoles(guildId);
		const { includeCurrent = true, includeNext = false, includePrevious = false } = options;

		return allRoles.reduce((roleList: string[], { levelrole: { level, roles } }) => {
			if (
				(includeCurrent && level === user.level) ||
				(includeNext && level > user.level) ||
				(includePrevious && level < user.level)
			) {
				if (roles?.length) roleList.push(...roles);
			}
			return roleList;
		}, []);
	}

	/**
	 * Set roles for a level (overwrites existing roles)
	 * @async
	 * @param {string} guildId - The guild ID
	 * @param {LevelRole} options - Level and role to set
	 * @link `Documentation:` https://simplyxp.js.org/docs/classes/LevelRoles#levelrolesset
	 * @returns {Promise<boolean>} - True if successful
	 * @throws {XpFatal} If an invalid type is provided or value is not provided, or if the database operation fails.
	 */
	static async set(guildId: string, options: LevelRole): Promise<boolean> {
		requireLevelRole("LevelRoles.set()", guildId, options, true);

		return await Database.updateOne(levelRoleQuery(guildId, options.level), levelRoleQuery(guildId, options.level, options.roles), {
			upsert: true
		}).then(() => true);
	}
}