import { Collection, Document, MongoClient } from "mongodb";
import { Database as SQLite } from "better-sqlite3";
import { XpFatal } from "../functions/xplogs";
import { xp } from "../../xp";

/**
 * Options for creating a user document.
 * @property {string} collection - The collection to create the document in.
 * @property {object} data - The data to create the document with.
 * @property {string} [data.guild] - The guild ID.
 * @property {string} [data.user] - The user ID.
 * @property {string} [data.name] - The username.
 * @property {number} [data.level] - The level.
 * @property {number} [data.xp] - The XP.
 * @property {number} [data.xp_rate] - The XP rate.
 */
export interface UserOptions {
	collection: "simply-xps";
	data: {
		flags?: Array<number | string>;
		guild: string;
		user?: string;
		name?: string;
		level?: number;
		xp?: number;
		xp_rate?: number;
	};
}

/**
 * The result of a user document.
 * @property {string} _id - The ID of the document.
 * @property {string} user - The user ID.
 * @property {string} name - The username.
 * @property {string} guild - The guild ID.
 * @property {number} level - The level.
 * @property {number} xp - The XP.
 * @property {number} xp_rate - The XP rate.
 * @property {string} createdAt - ISO String of the time the user was created.
 * @property {string} lastUpdated - ISO String of the last time the user was updated.
 */
export interface UserResult {
	_id?: string,
	flags?: Array<number | string>;
	guild: string;
	user: string;
	name?: string;
	level: number;
	xp: number;
	xp_rate?: number;
	createdAt?: string;
	lastUpdated: string;
}

/**
 * Options for creating a level role document.
 * @property {string} collection - The collection to create the document in.
 * @property {object} data - The data to create the document with.
 * @property {string} [data.guild] - The guild ID.
 * @property {object} [data.levelrole] - The level role data.
 * @property {number} [data.levelrole.level] - The level.
 * @property {Array<string>} [data.levelrole.roles] - The role ID(s).
 */
export interface LevelRoleOptions {
	collection: "simply-xp-levelroles";
	data: {
		guild: string;
		levelrole?: {
			level: number | null,
			roles?: Array<string> | null;
		};
	};
}

/**
 * The result of a level role document.
 * @property {string} _id - The ID of the document.
 * @property {string} guild - The guild ID.
 * @property {object} levelrole - V2: The level role data.
 * @property {number} [levelrole.level] - V2: The level.
 * @property {Array<string>} [levelrole.roles] - V2: The role ID(s).
 * @property {string} createdAt - ISO String of the time the level role was created.
 * @property {string} lastUpdated - ISO String of the last time the level role was updated.
 */
export type LevelRoleResult = {
	_id?: string,
	guild: string;
	levelrole: {
		level: number,
		roles?: Array<string>;
	};
	createdAt?: string;
	lastUpdated: string;
}

/**
 * Update options for updateOne method.
 * @property {boolean} [upsert] - Whether to insert a new document if no document matches the filter.
 */
export interface UpdateOptions {
	upsert?: boolean;
}

/**
 * Database class providing methods to interact with the database.
 * @class Database
 */
export class Database {

	/**
	 * Gets a collection from the database.
	 * @param {collection} collection - The collection to get.
	 * @link `Documentation:` https://simplyxp.js.org/docs/next/Classes/database#getCollection
	 * @returns {Collection} The collection.
	 * @throws {XpFatal} Throws an error if there is no database connection, or database type is invalid.
	 */
	static getCollection(collection: string): Collection {
		if (!xp.database) throw new XpFatal({ function: "getCollection()", message: "No database connection" });
		if (xp.dbType !== "mongodb") throw new XpFatal({
			function: "getCollection()",
			message: "MongoDB has to be your database type to use this function."
		});
		return (xp.database as MongoClient).db(xp.dbName).collection(collection);
	}

	/**
	 * Creates one document in the database.
	 *
	 * @async
	 * @param {UserOptions | LevelRoleOptions} query - The document to create.
	 * @link `Documentation:` https://simplyxp.js.org/docs/next/Classes/database#dbcreateone
	 * @returns {Promise<UserResult | LevelRoleResult>} The created document.
	 * @throws {XpFatal} Throws an error if there is no database connection.
	 */
	static async createOne(query: UserOptions | LevelRoleOptions): Promise<UserResult | LevelRoleResult> {
		if (!xp.database) throw new XpFatal({ function: "createOne()", message: "No database connection" });
		const createdAt = new Date().toISOString();

		switch (xp.dbType) {
			case "mongodb":
				await this.getCollection(query.collection).insertOne({
					...query.data, createdAt, lastUpdated: createdAt
				}).catch(error => handleError(error, "createOne()"));
				break;

			case "sqlite":
				if (query.collection === "simply-xps") (xp.database as SQLite).prepare("INSERT INTO \"simply-xps\" (user, guild, level, name, xp, xp_rate, flags, createdAt, lastUpdated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(query.data.user, query.data.guild, query.data.level, query.data?.name, query.data.xp, query.data.xp_rate, JSON.stringify(query.data?.flags), createdAt, createdAt);
				else (xp.database as SQLite).prepare("INSERT INTO \"simply-xp-levelroles\" (gid, levelrole, createdAt, lastUpdated) VALUES (?, ?, ?, ?)").run(query.data.guild, JSON.stringify(query.data.levelrole), createdAt, createdAt);
				break;
		}
		return await db.findOne(query) as UserResult | LevelRoleResult;
	}

	/**
	 * Deletes multiple documents from the database.
	 * @async
	 * @param {UserOptions | LevelRoleOptions} query - The documents to delete.
	 * @link https://simplyxp.js.org/docs/next/Classes/database#dbdeletemany Documentation
	 * @returns {Promise<boolean>} `true` if the documents were successfully deleted, otherwise `false`.
	 * @throws {XpFatal} Throws an error if there is no database connection.
	 */
	static async deleteMany(query: UserOptions | LevelRoleOptions): Promise<boolean> {
		if (!xp.database) throw new XpFatal({ function: "deleteMany()", message: "No database connection" });
		let result: Document;

		switch (xp.dbType) {
			case "mongodb":
				result = await this.getCollection(query.collection).deleteMany(query.data).catch(error => handleError(error, "deleteMany()")) as Document;
				break;
			case "sqlite":
				if (query.collection === "simply-xps") result = (xp.database as SQLite).prepare("DELETE FROM \"simply-xps\" WHERE guild = ?").run(query.data.guild);
				else result = (xp.database as SQLite).prepare("DELETE FROM \"simply-xp-levelroles\" WHERE gid = ?").run(query.data.guild);
		}
		return !!result;
	}

	/**
	 * Deletes one document from the database.
	 *
	 * @async
	 * @param {UserOptions | LevelRoleOptions} query - The document to delete.
	 * @link `Documentation:` https://simplyxp.js.org/docs/next/Classes/database#dbdeleteone
	 * @returns {Promise<boolean>} `true` if the document was successfully deleted, otherwise `false`.
	 * @throws {XpFatal} Throws an error if there is no database connection.
	 */
	static async deleteOne(query: UserOptions | LevelRoleOptions): Promise<boolean> {
		if (!xp.database) throw new XpFatal({ function: "deleteOne()", message: "No database connection" });

		switch (xp.dbType) {
			case "mongodb":
				return (await this.getCollection(query.collection).deleteOne(query.data).catch(error => handleError(error, "deleteOne()")) as Document).deletedCount > 0;

			case "sqlite":
				if (query.collection === "simply-xps") {
					return ((xp.database as SQLite).prepare("DELETE FROM \"simply-xps\" WHERE guild = ? AND user = ?").run(query.data.guild, query.data.user)).changes > 0;
				} else {
					return ((xp.database as SQLite).prepare("DELETE FROM \"simply-xp-levelroles\" WHERE gid = ? AND levelrole = ?").run(query.data.guild, query.data.levelrole)).changes > 0;
				}
		}
	}

	/**
	 * Finds one document in the database.
	 *
	 * @async
	 * @param {UserOptions | LevelRoleOptions} query - The query to search for the document.
	 * @link `Documentation:` https://simplyxp.js.org/docs/next/Classes/database#dbfindone
	 * @returns {Promise<UserResult | LevelRoleResult>} The found document.
	 * @throws {XpFatal} Throws an error if there is no database connection.
	 */
	static async findOne(query: UserOptions | LevelRoleOptions): Promise<UserResult | LevelRoleResult> {
		if (!xp.database) throw new XpFatal({ function: "findOne()", message: "No database connection" });

		switch (xp.dbType) {
			case "mongodb":
				return await this.getCollection(query.collection).findOne(query.data).catch(error => handleError(error, "findOne()")) as Document as UserResult | LevelRoleResult;
			case "sqlite":
				if (query.collection === "simply-xps") return (xp.database as SQLite).prepare("SELECT * FROM \"simply-xps\" WHERE guild = ? AND user = ?").get(query.data.guild, query.data.user) as Document as UserResult;
				else {
					if (!query.data.levelrole) handleError(new Error("levelrole is undefined"), "findOne()");
					const row = (xp.database as SQLite).prepare(`SELECT * FROM "simply-xp-levelroles" WHERE gid = ? AND json_extract(levelrole, '$.level') = ?`).get(query.data.guild, query.data.levelrole!.level) as Document;
					if (!row) return null as unknown as LevelRoleResult;
					row.levelrole = JSON.parse(row.levelrole);
					return row as LevelRoleResult;
				}
		}
	}

	/**
	 * Finds multiple documents in the database.
	 *
	 * @async
	 * @param {"simply-xps" | "simply-xp-levelroles"} collection - The collection to search for multiple documents.
	 * @param {string} guild - The guild ID to search for.
	 * @link `Documentation:` https://simplyxp.js.org/docs/next/Classes/database#dbfind
	 * @returns {Promise<UserResult[] | LevelRoleResult[]>} An array of found documents.
	 * @throws {XpFatal} Throws an error if there is no database connection.
	 */
	static async find(collection: "simply-xps" | "simply-xp-levelroles", guild: string): Promise<UserResult[] | LevelRoleResult[]> {
		if (!xp.database) throw new XpFatal({ function: "find()", message: "No database connection" });

		switch (xp.dbType) {
			case "mongodb":
				return (xp.database as MongoClient).db(xp.dbName).collection(collection).find({ guild }).toArray().catch(error => handleError(error, "find()")) as Document as UserResult[] | LevelRoleResult[];

			case "sqlite":
				if (collection === "simply-xps") {
					const rows = (xp.database as SQLite).prepare("SELECT * FROM \"simply-xps\" WHERE guild = ?").all(guild) as UserResult[];
					return rows.map(row => {
						return parseFlags(row);
					}) as UserResult[];
				} else {
					const rows = (xp.database as SQLite).prepare("SELECT * FROM \"simply-xp-levelroles\" WHERE gid = ?").all(guild) as LevelRoleResult[];
					return rows.map(row => {
						if (row.levelrole && typeof row.levelrole === "string") {
							row.levelrole = JSON.parse(row.levelrole);
						}
						return row as LevelRoleResult;
					}) as LevelRoleResult[];
				}
		}
	}

	/**
	 * Finds all documents in a collection.
	 * @param {"simply-xps" | "simply-xp-levelroles"} collection - The collection to search for all documents.
	 * @link `Documentation:` https://simplyxp.js.org/docs/next/Classes/database#dbfindall
	 * @returns {Promise<UserResult[] | LevelRoleResult[]>} An array of found documents.
	 * @throws {XpFatal} Throws an error if there is no database connection.
	 */
	static async findAll(collection: "simply-xps" | "simply-xp-levelroles"): Promise<UserResult[] | LevelRoleResult[]> {
		if (!xp.database) throw new XpFatal({ function: "findAll()", message: "No database connection" });

		switch (xp.dbType) {
			case "mongodb":
				return (xp.database as MongoClient).db(xp.dbName).collection(collection).find().toArray().catch(error => handleError(error, "findAll()")) as Document as UserResult[] | LevelRoleResult[];

			case "sqlite":
				if (collection === "simply-xps") {
					const rows = (xp.database as SQLite).prepare("SELECT * FROM \"simply-xps\"").all() as UserResult[];
					return rows.map(row => {
						return parseFlags(row);
					}) as UserResult[];
				} else {
					const rows = (xp.database as SQLite).prepare("SELECT * FROM \"simply-xp-levelroles\"").all() as LevelRoleResult[];
					return rows as LevelRoleResult[];
				}
		}
	}

	/**
	 * Updates one document in the database.
	 *
	 * @async
	 * @param {UserOptions | LevelRoleOptions} filter - The document to update.
	 * @param {UserOptions | LevelRoleOptions} update - The document update data.
	 * @param {UpdateOptions} [options] - MongoDB options for updating the document.
	 * @link `Documentation:` https://simplyxp.js.org/docs/next/Classes/database#dbupdateone
	 * @returns {Promise<UserResult | LevelRoleResult>} The updated document.
	 * @throws {XpFatal} Throws an error if there is no database connection.
	 */
	static async updateOne(filter: UserOptions | LevelRoleOptions, update: UserOptions | LevelRoleOptions, options?: UpdateOptions): Promise<UserResult | LevelRoleResult> {
		if (!xp.database) throw new XpFatal({ function: "updateOne()", message: "No database connection" });

		switch (xp.dbType) {
			case "mongodb":
				await this.getCollection(update.collection).updateOne(filter.data, {
					$set: {
						...update.data, lastUpdated: new Date().toISOString()
					}
				}, options).catch(error => handleError(error, "updateOne()"));
				break;

			case "sqlite":
				if (filter.collection !== update.collection) throw new XpFatal({
					function: "updateOne()",
					message: "Collection mismatch, expected same collection on both filter and update."
				});

				let setClause: string[] = [];
				let params: Array<string | number | (string | number)[] | undefined> = [];
				const now = new Date().toISOString();

				if (update.collection === "simply-xps") {
					const fields: Array<keyof UserOptions['data']> = ['level', 'name', 'xp', 'xp_rate', 'flags'];

					for (const f of fields) {
						const value = update.data[f];
						if (value !== undefined) {
							setClause.push(`${f} = ?`);
							params.push(f === 'flags' ? JSON.stringify(value) : value);
						}
					}

					setClause.push("lastUpdated = ?");
					params.push(now);

					const filterParams = [filter.data.guild, (filter.data as UserOptions["data"]).user];
					params.push(...filterParams);

					const stmt = (xp.database as SQLite).prepare(
						`UPDATE "simply-xps" SET ${setClause.join(", ")} WHERE guild = ? AND user = ?`
					);
					const result = stmt.run(...params);

					if (options?.upsert && result.changes === 0) {
						Database.createOne({
							collection: "simply-xps",
							data: {
								guild: filter.data.guild,
								user: (filter.data as UserOptions["data"]).user,
								name: update.data.name || (filter.data as UserOptions["data"]).user,
								level: update.data.level || 0,
								xp: update.data.xp || 0,
								xp_rate: update.data.xp_rate || xp.xp_rate,
								flags: update.data.flags || []
							}
						});
					}

				} else if (update.collection === "simply-xp-levelroles") {
					setClause.push("levelrole = ?", "lastUpdated = ?");
					params.push(JSON.stringify(update.data.levelrole), now);

					const filterParams = [filter.data.guild, JSON.stringify((filter.data as LevelRoleOptions["data"]).levelrole)];
					params.push(...filterParams);

					const stmt = (xp.database as SQLite).prepare(
						`UPDATE "simply-xp-levelroles" SET ${setClause.join(", ")} WHERE gid = ? AND levelrole = ?`
					);
					const result = stmt.run(...params);

					if (options?.upsert && result.changes === 0) {
						Database.createOne({
							collection: "simply-xp-levelroles",
							data: {
								guild: filter.data.guild,
								levelrole: update.data.levelrole
							}
						});
					}
				}
				break;
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
	throw new XpFatal({ function: `Database.${functionName}`, message: error });
}

function parseFlags<T extends UserResult | LevelRoleResult>(row: T): T {
	if ('flags' in row && typeof row.flags === "string") {
		row.flags = JSON.parse(row.flags) as Array<number | string>;
	}
	return row;
}

/**
 * Exports the `Database` class as `db`.
 * @deprecated Use `Database` class instead, this will be removed in the near future.
 */
export const db = Database;