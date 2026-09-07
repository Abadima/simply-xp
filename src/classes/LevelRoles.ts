import { XpFatal } from "../functions/xplogs";
import { Database, LevelRoleResult } from "./Database";

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
		if (!guildId) throw new XpFatal({ function: "LevelRoles.add()", message: "Guild ID was not provided" });
		if (!options) throw new XpFatal({ function: "LevelRoles.add()", message: "Options were not provided" });

		if (isNaN(options?.level)) {
			throw new XpFatal({
				function: "LevelRoles.add()",
				message: "Level must be a number"
			});
		}

		if (!options?.roles || !Array.isArray(options?.roles) || options?.roles.length === 0) {
			throw new XpFatal({
				function: "LevelRoles.add()",
				message: "Roles must be a non-empty array of strings"
			});
		}

		const existingRoles = await Database.findOne({
			collection: "simply-xp-levelroles",
			data: { guild: guildId, levelrole: { level: options.level } }
		}) as LevelRoleResult;

		if (existingRoles) {
			options.roles = Array.from(new Set([...(existingRoles.levelrole.roles ? existingRoles.levelrole.roles : []), ...options.roles]));
		}

		return await Database.updateOne(
			{
				collection: "simply-xp-levelroles",
				data: { guild: guildId, levelrole: { level: options.level } }
			},
			{
				collection: "simply-xp-levelroles",
				data: { guild: guildId, levelrole: { level: options.level, roles: options.roles } }
			},
			{
				upsert: true
			}
		).then(() => true);
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
		if (!guildId) throw new XpFatal({ function: "LevelRoles.delete()", message: "Guild ID was not provided" });
		if (!options) throw new XpFatal({ function: "LevelRoles.delete()", message: "Options were not provided" });

		if (isNaN(options?.level)) {
			throw new XpFatal({
				function: "LevelRoles.delete()",
				message: "Level must be a number"
			});
		}

		if (options?.roles && (!Array.isArray(options?.roles) || options?.roles.length === 0)) {
			throw new XpFatal({
				function: "LevelRoles.delete()",
				message: "Roles must be a non-empty array of strings"
			});
		}

		const existingRoles = await Database.findOne({
			collection: "simply-xp-levelroles",
			data: { guild: guildId, levelrole: { level: options.level } }
		}) as LevelRoleResult;

		if (!existingRoles) return false;

		const rolesToRemove = options.roles ?? [];
		const newRoles: string[] = rolesToRemove.length > 0 ? (existingRoles.levelrole.roles || []).filter((role) => !rolesToRemove.includes(role)) : [];

		if (newRoles.length === 0) return await Database.deleteOne({
			collection: "simply-xp-levelroles",
			data: { guild: guildId, levelrole: { level: options.level } }
		});

		return await Database.updateOne({
			collection: "simply-xp-levelroles",
			data: { guild: guildId, levelrole: { level: options.level } }
		}, {
			collection: "simply-xp-levelroles",
			data: { guild: guildId, levelrole: { level: options.level, roles: newRoles } }
		}).then((result) => Boolean(result));
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
		if (!guildId) throw new XpFatal({ function: "LevelRoles.deleteAll()", message: "Guild ID was not provided" });

		return await Database.deleteMany({
			collection: "simply-xp-levelroles",
			data: { guild: guildId }
		});
	}

	/**
	 * Fetch all roles in a guild's role setup
	 * @async
	 * @param {string} guildId - The guild ID
	 * @link `Documentation:` https://simplyxp.js.org/docs/classes/LevelRoles#levelrolesfetchall
	 * @returns {Promise<LevelRoleResult[]>} - The level role object
	 * @throws {XpFatal} If there are no roles in the guild.
	 */
	static async getGuildRoles(guildId: string): Promise<LevelRoleResult[]> {
		if (!guildId) throw new XpFatal({ function: "LevelRoles.fetchAll()", message: "Guild ID was not provided" });

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
		if (!userId) throw new XpFatal({ function: "LevelRoles.getUserRoles()", message: "User ID was not provided" });
		if (!guildId) throw new XpFatal({ function: "LevelRoles.getUserRoles()", message: "Guild ID was not provided" });

		const user = await Database.findOne({
			collection: "simply-xps", data: { user: userId, guild: guildId }
		}) as { level: number };

		if (!user?.level) return [];

		const allRoles = await LevelRoles.getGuildRoles(guildId) as LevelRoleResult[];
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
		if (!guildId) throw new XpFatal({ function: "LevelRoles.set()", message: "Guild ID was not provided" });
		if (!options) throw new XpFatal({ function: "LevelRoles.set()", message: "Options were not provided" });

		if (isNaN(options?.level)) {
			throw new XpFatal({
				function: "LevelRoles.set()",
				message: "Level must be a number"
			});
		}

		if (!Array.isArray(options?.roles) || options?.roles.length === 0) {

			throw new XpFatal({
				function: "LevelRoles.set()",
				message: "Roles must be a non-empty array of strings"
			});
		}

		return await Database.updateOne({
			collection: "simply-xp-levelroles",
			data: { guild: guildId, levelrole: { level: options.level } }
		}, {
			collection: "simply-xp-levelroles",
			data: { guild: guildId, levelrole: { level: options.level, roles: options.roles } }
		}, {
			upsert: true
		}).then(() => true);
	}
}