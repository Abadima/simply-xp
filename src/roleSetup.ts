import {db} from "../xp";
import { LevelRoleResult } from "./functions/database";
import {XpFatal} from "./functions/xplogs";

/**
 * Role setup object
 * @property {string} guild - The guild ID
 * @property {number} level - The level number
 * @property {string[] | string} roles - The role(s) to add
 */
export interface RoleSetupObject {
	level: number;
	role: string[] | string;
}

/**
 * Setup roles for levels
 * @class roleSetup
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
		if (!guildId) throw new XpFatal({function: "roleSetup.add()", message: "Guild ID was not provided"});
		if (!options) throw new XpFatal({function: "roleSetup.add()", message: "Options were not provided"});

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
			data: {guild: guildId, lvlrole: {lvl: options.level, role: options.role}}
		}).then(() => true).catch(() => false);
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
		if (!guildId) throw new XpFatal({function: "roleSetup.find()", message: "Guild ID was not provided"});
		if (isNaN(levelNumber)) throw new XpFatal({
			function: "roleSetup.find()", message: "Level Number was not provided"
		});

		const results = await db.findOne({
			collection: "simply-xp-levelroles",
			data: {guild: guildId, lvlrole: {lvl: levelNumber}}
		}) as LevelRoleResult;

		if (!results) return results;
		else {
			results.lvlrole = typeof(results.lvlrole) === "string" ? JSON.parse(results.lvlrole) : results.lvlrole;
			return results;
		}
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
		if (!guildId) throw new XpFatal({function: "roleSetup.remove()", message: "Guild ID was not provided"});
		if (isNaN(levelNumber)) throw new XpFatal({
			function: "roleSetup.remove()", message: "Level Number was not provided"
		});

		return await db.deleteOne({
			collection: "simply-xp-levelroles",
			data: {guild: guildId, lvlrole: {lvl: levelNumber}}
		});
	}
}