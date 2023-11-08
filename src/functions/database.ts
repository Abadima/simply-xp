import {Collection, Document, MongoClient} from "mongodb";
import {Database} from "better-sqlite3";
import {XpFatal} from "./xplogs";
import {xp} from "../../xp";

/**
 * Options for creating a user document.
 * @property {string} collection - The collection to create the document in.
 * @property {object} data - The data to create the document with.
 * @property {string} data.guild - The guild ID.
 * @property {string} [data.user] - The user ID.
 * @property {string} [data.name] - The username.
 * @property {number} [data.level] - The level.
 * @property {number} [data.xp] - The XP.
 */
export interface UserOptions {
	collection: "simply-xps";
	data: {
		guild: string;
		user?: string;
		name?: string;
		level?: number;
		xp?: number;
	};
}

/**
 * The result of a user document.
 * @property {string} [_id] - The ID of the document.
 * @property {string} user - The user ID.
 * @property {string} [name] - The username.
 * @property {string} guild - The guild ID.
 * @property {number} level - The level.
 * @property {number} xp - The XP.
 */
export interface UserResult {
	_id?: string,
	user: string;
	name?: string;
	guild: string;
	level: number;
	xp: number;
}

/**
 * Options for creating a level role document.
 * @property {string} collection - The collection to create the document in.
 * @property {object} data - The data to create the document with.
 * @property {string} data.guild - The guild ID.
 * @property {object} data.lvlrole - The level role data.
 * @property {number} data.lvlrole.lvl - The level.
 * @property {string | Array<string>} [data.lvlrole.role] - The role ID(s).
 */
export interface LevelRoleOptions {
	collection: "simply-xp-levelroles";
	data: {
		guild: string;
		lvlrole: {
			lvl: number,
			role?: string | Array<string>;
		};
	};
}

export type LevelRoleResult = {
	_id?: string,
	guild: string;
	lvlrole: string;
	timestamp: string;
}

/**
 * Database class providing methods to interact with the database.
 * @class db
 */
export class db {

	/**
	 * Gets a collection from the database.
	 * @param {collection} collection - The collection to get.
	 * @link https://simplyxp.js.org/docs/next/handlers/database#getCollection Documentation
	 * @returns {Collection} The collection.
	 * @throws {XpFatal} Throws an error if there is no database connection, or database type is invalid.
	 */
	static getCollection(collection: string): Collection {
		if (!xp.database) throw new XpFatal({function: "getCollection()", message: "No database connection"});
		if (xp.dbType !== "mongodb") throw new XpFatal({function: "getCollection()", message: "MongoDB has to be your database type to use this function."});
		return (xp.database as MongoClient).db().collection(collection);
	}

	/**
	 * Creates one document in the database.
	 *
	 * @async
	 * @param {UserOptions | LevelRoleOptions} query - The document to create.
	 * @link https://simplyxp.js.org/docs/next/handlers/database#createOne Documentation
	 * @returns {Promise<UserResult | LevelRoleResult>} The created document.
	 * @throws {XpFatal} Throws an error if there is no database connection.
	 */
	static async createOne(query: UserOptions | LevelRoleOptions): Promise<UserResult | LevelRoleResult> {
		if (!xp.database) throw new XpFatal({function: "createOne()", message: "No database connection"});

		switch (xp.dbType) {
		case "mongodb":
			(xp.database as MongoClient).db().collection(query.collection).insertOne(query.data).catch(error => handleError(error, "createOne()"));
			break;

		case "sqlite":
			if (query.collection === "simply-xps") (xp.database as Database).prepare("INSERT INTO \"simply-xps\" (user, guild, name, xp, level) VALUES (?, ?, ?, ?, ?)").run(query.data.user, query.data.guild, query.data?.name, query.data.xp, query.data.level);
			else (xp.database as Database).prepare("INSERT INTO \"simply-xp-levelroles\" (gid, lvlrole, timestamp) VALUES (?, ?, ?)").run(query.data.guild, JSON.stringify(query.data.lvlrole), new Date().toISOString());
			break;
		}
		return await db.findOne(query) as UserResult | LevelRoleResult;
	}

	/**
	 * Deletes multiple documents from the database.
	 * @async
	 * @param {UserOptions | LevelRoleOptions} query - The documents to delete.
	 * @link https://simplyxp.js.org/docs/next/handlers/database#deleteMany Documentation
	 * @returns {Promise<boolean>} `true` if the documents were successfully deleted, otherwise `false`.
	 * @throws {XpFatal} Throws an error if there is no database connection.
	 */
	static async deleteMany(query: UserOptions | LevelRoleOptions): Promise<boolean> {
		if (!xp.database) throw new XpFatal({function: "deleteMany()", message: "No database connection"});
		let result: Document;

		switch (xp.dbType) {
		case "mongodb":
			result = (xp.database as MongoClient).db().collection(query.collection).deleteMany(query.data).catch(error => handleError(error, "deleteMany()")) as Document;
			break;
		case "sqlite":
			if (query.collection === "simply-xps") result = (xp.database as Database).prepare("DELETE FROM \"simply-xps\" WHERE guild = ?").run(query.data.guild);
			else result = (xp.database as Database).prepare("DELETE FROM \"simply-xp-levelroles\" WHERE gid = ?").run(query.data.guild);
		}
		return !!result;
	}

	/**
	 * Deletes one document from the database.
	 *
	 * @async
	 * @param {UserOptions | LevelRoleOptions} query - The document to delete.
	 * @link https://simplyxp.js.org/docs/next/handlers/database#deleteOne Documentation
	 * @returns {Promise<boolean>} `true` if the document was successfully deleted, otherwise `false`.
	 * @throws {XpFatal} Throws an error if there is no database connection.
	 */
	static async deleteOne(query: UserOptions | LevelRoleOptions): Promise<boolean> {
		if (!xp.database) throw new XpFatal({function: "deleteOne()", message: "No database connection"});
		let result: Document;

		switch (xp.dbType) {
		case "mongodb":
			result = (xp.database as MongoClient).db().collection(query.collection).deleteOne(query.data).catch(error => handleError(error, "deleteOne()")) as Document;
			break;
		case "sqlite":
			if (query.collection === "simply-xps") result = (xp.database as Database).prepare("DELETE FROM \"simply-xps\" WHERE guild = ? AND user = ?").run(query.data.guild, query.data.user);
			else {
				result = await this.find(query);
				result = result.filter((row: LevelRoleResult) => JSON.parse(row.lvlrole).lvl === query.data.lvlrole.lvl)[0] as Document;
				result = (xp.database as Database).prepare("DELETE FROM \"simply-xp-levelroles\" WHERE gid = ? AND lvlrole = ?").run(query.data.guild, result.lvlrole) as Document;
			}
		}
		return !!result;
	}

	/**
	 * Finds one document in the database.
	 *
	 * @async
	 * @param {UserOptions | LevelRoleOptions} query - The query to search for the document.
	 * @link https://simplyxp.js.org/docs/next/handlers/database#findOne Documentation
	 * @returns {Promise<UserResult | LevelRoleResult>} The found document.
	 * @throws {XpFatal} Throws an error if there is no database connection.
	 */
	static async findOne(query: UserOptions | LevelRoleOptions): Promise<UserResult | LevelRoleResult> {
		if (!xp.database) throw new XpFatal({function: "findOne()", message: "No database connection"});
		let result: Document;

		switch (xp.dbType) {
		case "mongodb":
			if (query.collection === "simply-xps") result = await (xp.database as MongoClient).db().collection(query.collection).findOne(query.data).catch(error => handleError(error, "findOne()")) as Document;
			else result = await (xp.database as MongoClient).db().collection(query.collection).findOne({guild: query.data.guild, "lvlrole.lvl": query.data.lvlrole.lvl}).catch(error => handleError(error, "findOne()")) as Document;
			break;

		case "sqlite":
			if (query.collection === "simply-xps") result = (xp.database as Database).prepare("SELECT * FROM \"simply-xps\" WHERE guild = ? AND user = ?").get(query.data.guild, query.data.user) as Document;
			else {
				result = await this.find(query);
				result = result.filter((row: LevelRoleResult) => JSON.parse(row.lvlrole).lvl === query.data.lvlrole.lvl)[0];
			}
			break;
		}
		return result as UserResult | LevelRoleResult;
	}

	/**
	 * Finds multiple documents in the database.
	 *
	 * @async
	 * @param {UserOptions | LevelRoleOptions} query - The query to search for multiple documents.
	 * @link https://simplyxp.js.org/docs/next/handlers/database#find Documentation
	 * @returns {Promise<UserResult[] | LevelRoleResult[]>} An array of found documents.
	 * @throws {XpFatal} Throws an error if there is no database connection.
	 */
	static async find(query: UserOptions | LevelRoleOptions): Promise<UserResult[] | LevelRoleResult[]> {
		if (!xp.database) throw new XpFatal({function: "find()", message: "No database connection"});
		let result: Document;

		switch (xp.dbType) {
		case "mongodb":
			result = (xp.database as MongoClient).db().collection(query.collection).find(query.data).toArray().catch(error => handleError(error, "find()")) as Document;
			break;

		case "sqlite":
			if (query.collection === "simply-xps") result = (xp.database as Database).prepare("SELECT * FROM \"simply-xps\" WHERE guild = ?").all(query.data.guild) as Document;
			else result = (xp.database as Database).prepare("SELECT * FROM \"simply-xp-levelroles\" WHERE gid = ?").all(query.data.guild) as Document;
			break;
		}
		return result as UserResult[] | LevelRoleResult[];
	}

	/**
	 * Updates one document in the database.
	 *
	 * @async
	 * @param {UserOptions | LevelRoleOptions} filter - The document to update.
	 * @param {UserOptions | LevelRoleOptions} update - The document update data.
	 * @param {object} [options] - MongoDB options for updating the document.
	 * @link https://simplyxp.js.org/docs/next/handlers/database#updateOne Documentation
	 * @returns {Promise<UserResult | LevelRoleResult>} The updated document.
	 * @throws {XpFatal} Throws an error if there is no database connection.
	 */
	static async updateOne(filter: UserOptions | LevelRoleOptions, update: UserOptions | LevelRoleOptions, options?: object): Promise<UserResult | LevelRoleResult> {
		if (!xp.database) throw new XpFatal({function: "updateOne()", message: "No database connection"});

		switch (xp.dbType) {
		case "mongodb":
			await (xp.database as MongoClient).db().collection(update.collection).updateOne(filter.data, {$set: update.data}, options).catch(error => handleError(error, "updateOne()"));
			break;

		case "sqlite":
			if (filter.collection === "simply-xps" && update.collection === "simply-xps") (xp.database as Database).prepare("UPDATE \"simply-xps\" SET xp = ?, level = ?"+ (update.data?.name ? ", name = ?" : "") +" WHERE guild = ? AND user = ?").run(update.data?.name ? [update.data.xp, update.data.level, update.data.name, filter.data.guild, filter.data.user] : [update.data.xp, update.data.level, filter.data.guild, filter.data.user]);
			else if (filter.collection === "simply-xp-levelroles" && update.collection === "simply-xp-levelroles") (xp.database as Database).prepare("UPDATE \"simply-xp-levelroles\" SET lvlrole = ? WHERE gid = ?").run(JSON.stringify(update.data.lvlrole), filter.data.guild);
			else throw new XpFatal({
				function: "updateOne()", message: "Collection mismatch, expected same collection on both filter and update."
			});
		}
		return db.findOne(update);
	}
}


/**
 * Handle database errors
 * @param {Error} error
 * @param {string} functionName
 * @returns {void}
 * @private
 */
function handleError(error: Error, functionName: string): void {
	throw new XpFatal({function: `db.${functionName}`, message: error});
}