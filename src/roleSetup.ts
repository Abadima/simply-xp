import {db} from "../xp";
import {XpFatal} from "./functions/xplogs";

/**
 * Role setup object
 * @property {string} guild - The guild ID
 * @property {number} level - The level number
 * @property {string[] | string} roles - The role(s) to add
 */
export interface RoleSetupObject {
	guild?: string;
	level: number;
	roles: string[] | string;
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
	 * @link `Documentation:` https://simplyxp.js.org/docs/roleSetup/add
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

		if (!options?.roles) throw new XpFatal({
			function: "roleSetup.add()", message: "Role was not provided"
		});

		if (typeof options?.roles === "string") options.roles = [options.roles];

		return await db.createOne({
			// make a new ISO date
			collection: "simply-xp-levelroles",
			data: {guild: guildId, level: options.level, roles: options.roles, timestamp: new Date().toISOString()}
		}) as unknown as boolean;
	}

	/**
	 * Find a role in roleSetup
	 * @async
	 * @param {string} guildId - The guild ID
	 * @param {number} levelNumber - The level number
	 * @link `Documentation:` https://simplyxp.js.org/docs/roleSetup/find
	 * @returns {Promise<RoleSetupObject>} - The level role object
	 * @throws {XpFatal} If an invalid type is provided or value is not provided.
	 */
	static async find(guildId: string, levelNumber: number): Promise<RoleSetupObject> {
		if (!guildId) throw new XpFatal({function: "roleSetup.find()", message: "Guild ID was not provided"});
		if (isNaN(levelNumber)) throw new XpFatal({
			function: "roleSetup.find()", message: "Level Number was not provided"
		});

		return await db.findOne({
			collection: "simply-xp-levelroles",
			data: {guild: guildId, level: levelNumber, timestamp: new Date().toISOString()}
		}) as RoleSetupObject;
	}

	/**
	 * Remove a level from the role setup
	 * @async
	 * @param {string} guildId - The guild ID
	 * @param {number} levelNumber - The level number
	 * @link `Documentation:` https://simplyxp.js.org/docs/roleSetup/remove
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
			data: {guild: guildId, level: levelNumber, timestamp: new Date().toISOString()}
		});
	}
}