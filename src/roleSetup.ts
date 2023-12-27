import { db } from "../xp";
import { LevelRoleResult } from "./functions/database";
import { XpFatal } from "./functions/xplogs";

/**
 * Get Roles Object
 * @property {boolean?} includeNextRoles - Include roles for the next levels.
 * @property {boolean?} includePreviousRoles - Include roles for the previous levels.
 */
type GetRolesObject = {
	includeNextRoles?: boolean;
	includePreviousRoles?: boolean;
}

/**
 * Role setup object
 * @property {string} guild - The guild ID
 * @property {number} level - The level number
 * @property {string[] | string} role - The role(s) to add
 */
export interface RoleSetupObject {
	level: number;
	role: string[] | string;
}

/**
 * Setup roles for levels
 * @class roleSetup
 * @link `Documentation:` https://simplyxp.js.org/docs/next/classes/roleSetup
 */
export class roleSetup {
	/**
	 * Add a role to the role setup
	 * @async
	 * @param {string} guildId - The guild ID
	 * @param {RoleSetupObject} options - Level/role options
	 * @link `Documentation:` https://simplyxp.js.org/docs/next/classes/roleSetup#roleSetupadd
	 * @returns {Promise<boolean>} - True if successful
	 * @throws {XpFatal} If an invalid type is provided or value is not provided.
	 */
	static async add(guildId: string, options: RoleSetupObject): Promise<boolean> {
		if (!guildId) throw new XpFatal({ function: "roleSetup.add()", message: "Guild ID was not provided" });
		if (!options) throw new XpFatal({ function: "roleSetup.add()", message: "Options were not provided" });

		if (isNaN(options?.level)) throw new XpFatal({
			function: "roleSetup.add()",
			message: "Level must be a number"
		});

		if (!options?.role) throw new XpFatal({
			function: "roleSetup.add()", message: "Role was not provided"
		});

		if (typeof options?.role === "string") options.role = [options.role];

		return await db.createOne({
			collection: "simply-xp-levelroles",
			data: { guild: guildId, lvlrole: { lvl: options.level, role: options.role } }
		}).then(() => true).catch(() => false);
	}

	/**
	 * Get roles for a user's level
	 * @async
	 * @param {string} userId - The user ID
	 * @param {string} guildId - The guild ID
	 * @param {GetRolesObject} options - Options
	 * @link `Documentation:` https://simplyxp.js.org/docs/next/classes/roleSetup#roleSetupgetRoles
	 * @returns {Promise<string[]>} - Array of role IDs or empty array if none
	 * @throws {XpFatal} If an invalid type is provided or value is not provided.
	 */
	static async getRoles(userId: string, guildId: string, options: GetRolesObject = {}): Promise<string[]> {
		if (!userId) throw new XpFatal({ function: "roleSetup.getRoles()", message: "User ID was not provided" });
		if (!guildId) throw new XpFatal({ function: "roleSetup.getRoles()", message: "Guild ID was not provided" });

		const user = await db.findOne({
			collection: "simply-xps", data: { user: userId, guild: guildId }
		}) as { level: number };

		const allRoles = await roleSetup.list(guildId) as LevelRoleResult[];
		if (!user || !user?.level) return [];
		const roles: string[] = [];

		allRoles.forEach(({ lvlrole: { lvl, role } }) => {
			if (role && ((lvl < user.level && options?.includePreviousRoles) || (lvl > user.level && options?.includeNextRoles) || (lvl === user.level))) {
				roles.push(...(Array.isArray(role) ? role : [role]));
			}
		});

		return roles;
	}

	/**
	 * Find a role in roleSetup
	 * @async
	 * @param {string} guildId - The guild ID
	 * @param {number} levelNumber - The level number
	 * @link `Documentation:` https://simplyxp.js.org/docs/next/classes/roleSetup#roleSetupfind
	 * @returns {Promise<LevelRoleResult>} - The level role object
	 * @throws {XpFatal} If an invalid type is provided or value is not provided.
	 */
	static async find(guildId: string, levelNumber: number): Promise<LevelRoleResult> {
		if (!guildId) throw new XpFatal({ function: "roleSetup.find()", message: "Guild ID was not provided" });
		if (isNaN(levelNumber)) throw new XpFatal({
			function: "roleSetup.find()", message: "Level Number was not provided"
		});

		return await db.findOne({
			collection: "simply-xp-levelroles",
			data: { guild: guildId, lvlrole: { lvl: levelNumber } }
		}) as LevelRoleResult;
	}

	/**
	 * List all level roles in a guild
	 * @async
	 * @param {string} guildId - The guild ID
	 * @link `Documentation:` https://simplyxp.js.org/docs/next/classes/roleSetup#roleSetuplist
	 * @returns {Promise<LevelRoleResult[]>} - The level role object
	 * @throws {XpFatal} If there are no roles in the guild.
	 */
	static async list(guildId: string): Promise<LevelRoleResult[]> {
		if (!guildId) throw new XpFatal({ function: "roleSetup.list()", message: "Guild ID was not provided" });

		return await db.find({
			collection: "simply-xp-levelroles",
			data: { guild: guildId, lvlrole: { lvl: null, role: null } }
		}) as LevelRoleResult[];
	}

	/**
	 * Remove a level from the role setup
	 * @async
	 * @param {string} guildId - The guild ID
	 * @param {number} levelNumber - The level number
	 * @link `Documentation:` https://simplyxp.js.org/docs/next/classes/roleSetup#roleSetupremove
	 * @returns {Promise<boolean>} - True if successful
	 * @throws {XpFatal} If an invalid type is provided or value is not provided.
	 */
	static async remove(guildId: string, levelNumber: number): Promise<boolean> {
		if (!guildId) throw new XpFatal({ function: "roleSetup.remove()", message: "Guild ID was not provided" });
		if (isNaN(levelNumber)) throw new XpFatal({
			function: "roleSetup.remove()", message: "Level Number was not provided"
		});

		return await db.deleteOne({
			collection: "simply-xp-levelroles",
			data: { guild: guildId, lvlrole: { lvl: levelNumber } }
		});
	}
}