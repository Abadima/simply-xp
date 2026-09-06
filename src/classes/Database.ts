import { requireDatabaseConnection as requireConnected } from "../functions/guards";
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
	flags: Array<number | string>;
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
	private static requireDatabaseConnection(functionName: string): void {
		requireConnected(functionName);
	}

	/**
	 * Gets a collection from the database.
	 * @param {collection} collection - The collection to get.
	 * @link `Documentation:` https://simplyxp.js.org/docs/Classes/database#getCollection
	 * @returns {Collection} The collection.
	 * @throws {XpFatal} Throws an error if there is no database connection, or database type is invalid.
	 */
	static getCollection(collection: string): Collection {
		this.requireDatabaseConnection("getCollection()");
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
	 * @link `Documentation:` https://simplyxp.js.org/docs/Classes/database#dbcreateone
	 * @returns {Promise<UserResult | LevelRoleResult>} The created document.
	 * @throws {XpFatal} Throws an error if there is no database connection.
	 */
	static async createOne(query: UserOptions | LevelRoleOptions): Promise<UserResult | LevelRoleResult> {
		this.requireDatabaseConnection("createOne()");
		const createdAt = new Date().toISOString();
		const normalizedUserCreateData = query.collection === "simply-xps"
			? normalizeUserCreateData(query.data as UserOptions["data"])
			: null;

		switch (xp.dbType) {
			case "mongodb": {
				const normalizedCreateData = query.collection === "simply-xps"
					? normalizedUserCreateData as UserOptions["data"]
					: query.data;

				// Upsert on the same unique key SQLite's INSERT OR IGNORE matches, so creating
				// a document that already exists is a no-op on both adapters, not an error.
				const filter = query.collection === "simply-xps"
					? { guild: normalizedCreateData.guild, user: (normalizedCreateData as UserOptions["data"]).user }
					: normalizeCollectionFilter(query);

				await this.getCollection(query.collection).updateOne(
					filter,
					{ $setOnInsert: { ...normalizedCreateData, createdAt, lastUpdated: createdAt } },
					{ upsert: true }
				).catch(error => handleError(error, "createOne()"));
				break;
			}

			case "sqlite":
				if (query.collection === "simply-xps") {
					(xp.database as SQLite).prepare("INSERT OR IGNORE INTO \"simply-xps\" (user, guild, level, name, xp, xp_rate, flags, createdAt, lastUpdated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(normalizedUserCreateData?.user, normalizedUserCreateData?.guild, normalizedUserCreateData?.level, normalizedUserCreateData?.name, normalizedUserCreateData?.xp, normalizedUserCreateData?.xp_rate, JSON.stringify(normalizedUserCreateData?.flags || []), createdAt, createdAt);
				} else {
					(xp.database as SQLite).prepare("INSERT OR IGNORE INTO \"simply-xp-levelroles\" (guild, levelrole, createdAt, lastUpdated) VALUES (?, ?, ?, ?)").run(query.data.guild, JSON.stringify(query.data.levelrole), createdAt, createdAt);
				}
				break;
		}

		if (query.collection === "simply-xps") {
			const createdUser = await db.findOne({
				collection: "simply-xps",
				data: { guild: normalizedUserCreateData?.guild as string, user: normalizedUserCreateData?.user }
			}) as UserResult | null;

			if (!createdUser) throw new XpFatal({ function: "createOne()", message: "Could not resolve created user row" });
			return createdUser;
		}

		const level = getLevelRoleLevel(query.data);
		if (level === null) throw new XpFatal({ function: "createOne()", message: "Level role level was not provided" });

		const createdLevelRole = await db.findOne({
			collection: "simply-xp-levelroles",
			data: { guild: query.data.guild, levelrole: { level } }
		}) as LevelRoleResult | null;

		if (!createdLevelRole) throw new XpFatal({ function: "createOne()", message: "Could not resolve created level role row" });
		return createdLevelRole;
	}

	/**
	 * Deletes multiple documents from the database.
	 * @async
	 * @param {UserOptions | LevelRoleOptions} query - The documents to delete.
	 * @link https://simplyxp.js.org/docs/Classes/database#dbdeletemany Documentation
	 * @returns {Promise<boolean>} `true` if the documents were successfully deleted, otherwise `false`.
	 * @throws {XpFatal} Throws an error if there is no database connection.
	 */
	static async deleteMany(query: UserOptions | LevelRoleOptions): Promise<boolean> {
		this.requireDatabaseConnection("deleteMany()");
		let result: Document;

		switch (xp.dbType) {
			case "mongodb":
				result = await this.getCollection(query.collection).deleteMany(normalizeCollectionFilter(query)).catch(error => handleError(error, "deleteMany()")) as Document;
				return result.deletedCount > 0;

			case "sqlite":
				if (query.collection === "simply-xps") {
					result = (xp.database as SQLite).prepare("DELETE FROM \"simply-xps\" WHERE guild = ?").run(query.data.guild);
				} else {
					result = (xp.database as SQLite).prepare("DELETE FROM \"simply-xp-levelroles\" WHERE guild = ?").run(query.data.guild);
				}
				return result.changes > 0;
		}
	}

	/**
	 * Deletes one document from the database.
	 *
	 * @async
	 * @param {UserOptions | LevelRoleOptions} query - The document to delete.
	 * @link `Documentation:` https://simplyxp.js.org/docs/Classes/database#dbdeleteone
	 * @returns {Promise<boolean>} `true` if the document was successfully deleted, otherwise `false`.
	 * @throws {XpFatal} Throws an error if there is no database connection.
	 */
	static async deleteOne(query: UserOptions | LevelRoleOptions): Promise<boolean> {
		this.requireDatabaseConnection("deleteOne()");

		switch (xp.dbType) {
			case "mongodb":
				return (await this.getCollection(query.collection).deleteOne(normalizeCollectionFilter(query)).catch(error => handleError(error, "deleteOne()")) as Document).deletedCount > 0;

			case "sqlite":
				if (query.collection === "simply-xps") {
					return ((xp.database as SQLite).prepare("DELETE FROM \"simply-xps\" WHERE guild = ? AND user = ?").run(query.data.guild, query.data.user)).changes > 0;
				} else {
					const level = getLevelRoleLevel(query.data);
					if (level === null) return false;
					return ((xp.database as SQLite).prepare("DELETE FROM \"simply-xp-levelroles\" WHERE guild = ? AND json_extract(levelrole, '$.level') = ?").run(query.data.guild, level)).changes > 0;
				}
		}
	}

	/**
	 * Finds one document in the database.
	 *
	 * @async
	 * @param {UserOptions | LevelRoleOptions} query - The query to search for the document.
	 * @link `Documentation:` https://simplyxp.js.org/docs/Classes/database#dbfindone
	 * @returns {Promise<UserResult | LevelRoleResult | null>} The found document or null.
	 * @throws {XpFatal} Throws an error if there is no database connection.
	 */
	static async findOne(query: UserOptions | LevelRoleOptions): Promise<UserResult | LevelRoleResult | null> {
		this.requireDatabaseConnection("findOne()");

		switch (xp.dbType) {
			case "mongodb":
				const mongoResult = await this.getCollection(query.collection).findOne(normalizeCollectionFilter(query)).catch(error => handleError(error, "findOne()")) as Document;
				if (!mongoResult) return null;
				if (query.collection === "simply-xps") return parseFlags(mongoResult as UserResult);
				return parseLevelRoleRow(mongoResult as LevelRoleResult) as LevelRoleResult;

			case "sqlite":
				if (query.collection === "simply-xps") {
					const row = (xp.database as SQLite).prepare("SELECT * FROM \"simply-xps\" WHERE guild = ? AND user = ?").get(query.data.guild, query.data.user) as Document;
					if (!row) return null;
					return parseFlags(row as UserResult);
				}

				else {
					const level = getLevelRoleLevel(query.data);
					if (level === null) handleError(new Error("levelrole is undefined"), "findOne()");
					const row = (xp.database as SQLite).prepare(`SELECT * FROM "simply-xp-levelroles" WHERE guild = ? AND json_extract(levelrole, '$.level') = ?`).get(query.data.guild, level) as Document;
					if (!row) return null;
					return parseLevelRoleRow(row as LevelRoleResult) as LevelRoleResult;
				}
		}
	}

	/**
	 * Finds multiple documents in the database.
	 *
	 * @async
	 * @param {"simply-xps" | "simply-xp-levelroles"} collection - The collection to search for multiple documents.
	 * @param {string} guild - The guild ID to search for.
	 * @param {number} [limit] - Optional max number of documents to return.
	 * @link `Documentation:` https://simplyxp.js.org/docs/Classes/database#dbfind
	 * @returns {Promise<UserResult[] | LevelRoleResult[]>} An array of found documents.
	 * @throws {XpFatal} Throws an error if there is no database connection.
	 */
	static async find(collection: "simply-xps" | "simply-xp-levelroles", guild: string, limit?: number): Promise<UserResult[] | LevelRoleResult[]> {
		this.requireDatabaseConnection("find()");

		switch (xp.dbType) {
			case "mongodb":
				const mongoCursor = (xp.database as MongoClient).db(xp.dbName).collection(collection).find({ guild });
				if (limit && limit > 0 && collection === "simply-xps") {
					mongoCursor.sort({ xp: -1 }).limit(limit);
				}
				const mongoRows = await mongoCursor.toArray().catch(error => handleError(error, "find()")) as Document[];
				if (collection === "simply-xps") return mongoRows.map((row) => parseFlags(row as UserResult)) as UserResult[];
				return mongoRows.map((row) => parseLevelRoleRow(row as LevelRoleResult)).filter(Boolean) as LevelRoleResult[];

			case "sqlite":
				if (collection === "simply-xps") {
					const query = limit && limit > 0 ?
						"SELECT * FROM \"simply-xps\" WHERE guild = ? ORDER BY xp DESC LIMIT ?" :
						"SELECT * FROM \"simply-xps\" WHERE guild = ?";
					const rows = (limit && limit > 0 ?
						(xp.database as SQLite).prepare(query).all(guild, limit) :
						(xp.database as SQLite).prepare(query).all(guild)) as UserResult[];
					return rows.map(row => {
						return parseFlags(row);
					}) as UserResult[];
				} else {
					const rows = (xp.database as SQLite).prepare("SELECT * FROM \"simply-xp-levelroles\" WHERE guild = ?").all(guild) as LevelRoleResult[];
					return rows.map(row => parseLevelRoleRow(row)).filter(Boolean) as LevelRoleResult[];
				}
		}
	}

	/**
	 * Finds all documents in a collection.
	 * @param {"simply-xps" | "simply-xp-levelroles"} collection - The collection to search for all documents.
	 * @param {number} [limit] - Optional max number of documents to return.
	 * @link `Documentation:` https://simplyxp.js.org/docs/Classes/database#dbfindall
	 * @returns {Promise<UserResult[] | LevelRoleResult[]>} An array of found documents.
	 * @throws {XpFatal} Throws an error if there is no database connection.
	 */
	static async findAll(collection: "simply-xps" | "simply-xp-levelroles", limit?: number): Promise<UserResult[] | LevelRoleResult[]> {
		this.requireDatabaseConnection("findAll()");

		switch (xp.dbType) {
			case "mongodb":
				const mongoCursor = (xp.database as MongoClient).db(xp.dbName).collection(collection).find();
				if (limit && limit > 0 && collection === "simply-xps") {
					mongoCursor.sort({ xp: -1 }).limit(limit);
				}
				const mongoRows = await mongoCursor.toArray().catch(error => handleError(error, "findAll()")) as Document[];
				if (collection === "simply-xps") return mongoRows.map((row) => parseFlags(row as UserResult)) as UserResult[];
				return mongoRows.map((row) => parseLevelRoleRow(row as LevelRoleResult)).filter(Boolean) as LevelRoleResult[];

			case "sqlite":
				if (collection === "simply-xps") {
					const query = limit && limit > 0 ?
						"SELECT * FROM \"simply-xps\" ORDER BY xp DESC LIMIT ?" :
						"SELECT * FROM \"simply-xps\"";
					const rows = (limit && limit > 0 ?
						(xp.database as SQLite).prepare(query).all(limit) :
						(xp.database as SQLite).prepare(query).all()) as UserResult[];
					return rows.map(row => {
						return parseFlags(row);
					}) as UserResult[];
				} else {
					const rows = (xp.database as SQLite).prepare("SELECT * FROM \"simply-xp-levelroles\"").all() as LevelRoleResult[];
					return rows.map(row => parseLevelRoleRow(row)).filter(Boolean) as LevelRoleResult[];
				}
		}
	}

	/**
	 * Finds global leaderboard rows while deduplicating users at the database level.
	 * @async
	 * @param {number} [limit] - Optional max number of users to return.
	 * @returns {Promise<UserResult[]>} Global leaderboard rows with one best-XP row per user.
	 * @throws {XpFatal} Throws an error if there is no database connection.
	 */
	static async findGlobalLeaderboard(limit?: number): Promise<UserResult[]> {
		this.requireDatabaseConnection("findGlobalLeaderboard()");
		const normalizedLimit = typeof limit === "number" && Number.isInteger(limit) && limit > 0 ? limit : undefined;

		switch (xp.dbType) {
			case "mongodb": {
				const pipeline: Document[] = [
					{ $match: { user: { $exists: true, $ne: null } } },
					{ $sort: { xp: -1, lastUpdated: -1, createdAt: -1, _id: -1 } },
					{ $group: { _id: "$user", doc: { $first: "$$ROOT" } } },
					{ $replaceRoot: { newRoot: "$doc" } },
					{ $sort: { xp: -1, lastUpdated: -1, createdAt: -1, _id: -1 } },
				];

				if (normalizedLimit) pipeline.push({ $limit: normalizedLimit });

				const rows = await (xp.database as MongoClient)
					.db(xp.dbName)
					.collection("simply-xps")
					.aggregate(pipeline)
					.toArray()
					.catch((error) => handleError(error, "findGlobalLeaderboard()")) as Document[];

				return rows.map((row) => parseFlags(row as UserResult));
			}

			case "sqlite": {
				const baseQuery = `
					SELECT *
					FROM (
						SELECT
							rowid AS _rowid,
							*,
							ROW_NUMBER() OVER (
								PARTITION BY user
								ORDER BY xp DESC, COALESCE(lastUpdated, createdAt, '') DESC, rowid DESC
							) AS rn
						FROM "simply-xps"
					)
					WHERE rn = 1
					ORDER BY xp DESC, COALESCE(lastUpdated, createdAt, '') DESC, _rowid DESC
				`;

				const rows = normalizedLimit
					? (xp.database as SQLite).prepare(`${baseQuery} LIMIT ?`).all(normalizedLimit)
					: (xp.database as SQLite).prepare(baseQuery).all();

				return (rows as Array<UserResult & { _rowid: number; rn: number }>).map((row) => {
					const { _rowid, rn, ...userRow } = row;
					void _rowid;
					void rn;
					return parseFlags(userRow as UserResult);
				});
			}
		}
	}

	/**
	 * Counts users in a guild with strictly more XP than the given value. Used to compute a
	 * user's leaderboard position without loading the full guild into memory.
	 * @async
	 * @param {string} guildId - The guild ID.
	 * @param {number} xpValue - Count users with XP greater than this value.
	 * @link `Documentation:` https://simplyxp.js.org/docs/Classes/database#dbcountuserswithmorexp
	 * @returns {Promise<number>} The number of users with more XP.
	 * @throws {XpFatal} Throws an error if there is no database connection.
	 */
	static async countUsersWithMoreXp(guildId: string, xpValue: number): Promise<number> {
		this.requireDatabaseConnection("countUsersWithMoreXp()");

		switch (xp.dbType) {
			case "mongodb":
				return await (xp.database as MongoClient)
					.db(xp.dbName)
					.collection("simply-xps")
					.countDocuments({ guild: guildId, xp: { $gt: xpValue } });

			case "sqlite": {
				const row = (xp.database as SQLite)
					.prepare("SELECT COUNT(*) as count FROM \"simply-xps\" WHERE guild = ? AND xp > ?")
					.get(guildId, xpValue) as { count?: number } | undefined;
				return row?.count || 0;
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
	 * @link `Documentation:` https://simplyxp.js.org/docs/Classes/database#dbupdateone
	 * @returns {Promise<UserResult | LevelRoleResult | null>} The updated document or null.
	 * @throws {XpFatal} Throws an error if there is no database connection.
	 */
	static async updateOne(filter: UserOptions | LevelRoleOptions, update: UserOptions | LevelRoleOptions, options?: UpdateOptions): Promise<UserResult | LevelRoleResult | null> {
		this.requireDatabaseConnection("updateOne()");
		const now = new Date().toISOString();

		switch (xp.dbType) {
			case "mongodb":
				let mongoResult: Document;
				const normalizedUpdateData = update.collection === "simply-xps"
					? normalizeUserWriteData(update.data as UserOptions["data"])
					: update.data;
				try {
					mongoResult = await this.getCollection(update.collection).updateOne(normalizeCollectionFilter(filter), {
						$set: {
							...normalizedUpdateData, lastUpdated: now
						}
					}, options) as Document;
				} catch (error) {
					handleError(error as Error, "updateOne()");
				}

				if (mongoResult.matchedCount === 0 && mongoResult.upsertedCount === 0) {
					return null;
				}

				break;

			case "sqlite":
				if (filter.collection !== update.collection) throw new XpFatal({
					function: "updateOne()",
					message: "Collection mismatch, expected same collection on both filter and update."
				});

				const setClause: string[] = [];
				const params: Array<string | number | (string | number)[] | undefined> = [];
				let shouldReturnNull = false;

				if (update.collection === "simply-xps") {
					const fields: Array<keyof UserOptions['data']> = ['level', 'name', 'xp', 'xp_rate', 'flags'];
					const hasFlagsField = Object.prototype.hasOwnProperty.call(update.data, "flags");

					for (const f of fields) {
						const value = update.data[f];

						if (f === "flags") {
							if (hasFlagsField) {
								setClause.push("flags = ?");
								params.push(JSON.stringify(normalizeUserFlags((update.data as UserOptions["data"]).flags)));
							}
							continue;
						}

						if (value !== undefined) {
							setClause.push(`${f} = ?`);
							params.push(value);
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
						await Database.createOne({
							collection: "simply-xps",
							data: {
								guild: filter.data.guild,
								user: (filter.data as UserOptions["data"]).user,
								name: update.data.name || (filter.data as UserOptions["data"]).user,
								level: update.data.level || 0,
								xp: update.data.xp || 0,
								xp_rate: update.data.xp_rate || xp.xp_rate,
								flags: normalizeUserFlags((update.data as UserOptions["data"]).flags)
							}
						});
					} else if (result.changes === 0) {
						const existing = (xp.database as SQLite).prepare("SELECT 1 FROM \"simply-xps\" WHERE guild = ? AND user = ?").get(filter.data.guild, (filter.data as UserOptions["data"]).user);
						if (!existing) shouldReturnNull = true;
					}

				} else if (update.collection === "simply-xp-levelroles") {
					const level = getLevelRoleLevel((filter.data as LevelRoleOptions["data"])) ?? getLevelRoleLevel((update.data as LevelRoleOptions["data"]));
					if (level === null) throw new XpFatal({
						function: "updateOne()",
						message: "Level role level was not provided."
					});

					setClause.push("levelrole = ?", "lastUpdated = ?");
					params.push(JSON.stringify(update.data.levelrole), now);

					const filterParams = [filter.data.guild, level];
					params.push(...filterParams);

					const stmt = (xp.database as SQLite).prepare(
						`UPDATE "simply-xp-levelroles" SET ${setClause.join(", ")} WHERE guild = ? AND json_extract(levelrole, '$.level') = ?`
					);
					const result = stmt.run(...params);

					if (options?.upsert && result.changes === 0) {
						await Database.createOne({
							collection: "simply-xp-levelroles",
							data: {
								guild: filter.data.guild,
								levelrole: update.data.levelrole
							}
						});
					} else if (result.changes === 0) {
						const existing = (xp.database as SQLite).prepare("SELECT 1 FROM \"simply-xp-levelroles\" WHERE guild = ? AND json_extract(levelrole, '$.level') = ?").get(filter.data.guild, level);
						if (!existing) shouldReturnNull = true;
					}
				}

				if (shouldReturnNull) return null;
				break;
		}

		if (update.collection === "simply-xps") {
			return db.findOne({
				collection: "simply-xps",
				data: {
					guild: (filter.data as UserOptions["data"]).guild,
					user: (filter.data as UserOptions["data"]).user
				}
			}) as Promise<UserResult | null>;
		}

		const level = getLevelRoleLevel((filter.data as LevelRoleOptions["data"])) ?? getLevelRoleLevel((update.data as LevelRoleOptions["data"]));
		if (level === null) return null;

		return db.findOne({
			collection: "simply-xp-levelroles",
			data: {
				guild: (filter.data as LevelRoleOptions["data"]).guild,
				levelrole: { level }
			}
		}) as Promise<LevelRoleResult | null>;
	}

	/**
	 * Get a private key/value store for a plugin, so plugins can persist their own data
	 * without touching `xp.database` or the simply-xp tables directly.
	 *
	 * Works on both MongoDB and SQLite. Storage is created lazily on first write, so plugins
	 * that never store anything cost nothing.
	 * @param {string} name - Namespace, usually your plugin's package name.
	 * @link `Documentation:` https://simplyxp.js.org/docs/Classes/database#dbnamespace
	 * @returns {PluginStore} A store scoped to `name`.
	 * @throws {XpFatal} Throws an error if no name is provided.
	 */
	static namespace(name: string): PluginStore {
		if (!name || typeof name !== "string") throw new XpFatal({
			function: "namespace()", message: "Namespace name was not provided"
		});

		return createPluginStore(name.trim());
	}
}

/**
 * A namespaced key/value store handed to plugins by `Database.namespace()`.
 * @property {Function} get - Read a value, or `null` when the key is not set.
 * @property {Function} set - Write a value. Anything JSON-serialisable is accepted.
 * @property {Function} delete - Remove a key, returning whether it existed.
 * @property {Function} keys - List every key in this namespace.
 * @property {Function} clear - Remove every key in this namespace, returning how many were removed.
 */
export interface PluginStore {
	get<T = unknown>(key: string): Promise<T | null>;

	set(key: string, value: unknown): Promise<void>;

	delete(key: string): Promise<boolean>;

	keys(): Promise<string[]>;

	clear(): Promise<number>;
}

const PLUGIN_COLLECTION = "simply-xp-plugins";
// Tracks which SQLite handle the plugin table has been verified on, so a reconnect
// to a different database re-checks instead of trusting a stale flag.
let sqlitePluginTableFor: unknown = null;

/**
 * Whether the SQLite plugin table exists yet. Reads use this to stay lazy: if no plugin has
 * ever stored anything, there is nothing to read and no table is created.
 * @private
 */
function sqlitePluginTableExists(): boolean {
	if (sqlitePluginTableFor === xp.database) return true;

	const exists = Boolean((xp.database as SQLite)
		.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
		.get(PLUGIN_COLLECTION));
	if (exists) sqlitePluginTableFor = xp.database;
	return exists;
}

/**
 * Creates the plugin table/index on first write.
 * @private
 */
async function ensurePluginStorage(functionName: string): Promise<void> {
	requireConnected(functionName);

	if (xp.dbType === "sqlite") {
		if (sqlitePluginTableFor === xp.database) return;
		(xp.database as SQLite).exec(`
			CREATE TABLE IF NOT EXISTS "${PLUGIN_COLLECTION}" (
				namespace   TEXT NOT NULL,
				key         TEXT NOT NULL,
				value       TEXT,
				lastUpdated DATE NOT NULL DEFAULT (datetime('now')),
				PRIMARY KEY (namespace, key)
			);
		`);
		sqlitePluginTableFor = xp.database;
		return;
	}

	await (xp.database as MongoClient).db(xp.dbName).collection(PLUGIN_COLLECTION).createIndex(
		{ namespace: 1, key: 1 },
		{ unique: true, name: "idx_simply_xp_plugins_namespace_key" }
	);
}

/**
 * @private
 */
function requireKey(functionName: string, key: string): void {
	if (!key || typeof key !== "string") throw new XpFatal({ function: functionName, message: "Key was not provided" });
}

/**
 * @private
 */
function createPluginStore(namespace: string): PluginStore {
	return {
		async get<T = unknown>(key: string): Promise<T | null> {
			requireKey("namespace().get()", key);
			requireConnected("namespace().get()");

			if (xp.dbType === "sqlite") {
				if (!sqlitePluginTableExists()) return null;
				const row = (xp.database as SQLite)
					.prepare(`SELECT value FROM "${PLUGIN_COLLECTION}" WHERE namespace = ? AND key = ?`)
					.get(namespace, key) as { value?: string } | undefined;
				if (!row || typeof row.value !== "string") return null;
				return safeJsonParse<T | null>(row.value, null);
			}

			const document = await (xp.database as MongoClient).db(xp.dbName)
				.collection(PLUGIN_COLLECTION)
				.findOne({ namespace, key })
				.catch(error => handleError(error, "namespace().get()"));
			return document ? (document.value as T) : null;
		},

		async set(key: string, value: unknown): Promise<void> {
			requireKey("namespace().set()", key);
			await ensurePluginStorage("namespace().set()");
			const now = new Date().toISOString();

			if (xp.dbType === "sqlite") {
				(xp.database as SQLite)
					.prepare(`INSERT INTO "${PLUGIN_COLLECTION}" (namespace, key, value, lastUpdated) VALUES (?, ?, ?, ?)
						ON CONFLICT(namespace, key) DO UPDATE SET value = excluded.value, lastUpdated = excluded.lastUpdated`)
					.run(namespace, key, JSON.stringify(value ?? null), now);
				return;
			}

			await (xp.database as MongoClient).db(xp.dbName)
				.collection(PLUGIN_COLLECTION)
				.updateOne({ namespace, key }, { $set: { value, lastUpdated: now } }, { upsert: true })
				.catch(error => handleError(error, "namespace().set()"));
		},

		async delete(key: string): Promise<boolean> {
			requireKey("namespace().delete()", key);
			requireConnected("namespace().delete()");

			if (xp.dbType === "sqlite") {
				if (!sqlitePluginTableExists()) return false;
				return (xp.database as SQLite)
					.prepare(`DELETE FROM "${PLUGIN_COLLECTION}" WHERE namespace = ? AND key = ?`)
					.run(namespace, key).changes > 0;
			}

			const result = await (xp.database as MongoClient).db(xp.dbName)
				.collection(PLUGIN_COLLECTION)
				.deleteOne({ namespace, key })
				.catch(error => handleError(error, "namespace().delete()"));
			return result.deletedCount > 0;
		},

		async keys(): Promise<string[]> {
			requireConnected("namespace().keys()");

			if (xp.dbType === "sqlite") {
				if (!sqlitePluginTableExists()) return [];
				const rows = (xp.database as SQLite)
					.prepare(`SELECT key FROM "${PLUGIN_COLLECTION}" WHERE namespace = ?`)
					.all(namespace) as { key: string }[];
				return rows.map((row) => row.key);
			}

			const documents = await (xp.database as MongoClient).db(xp.dbName)
				.collection(PLUGIN_COLLECTION)
				.find({ namespace })
				.toArray()
				.catch(error => handleError(error, "namespace().keys()"));
			return documents.map((document) => document.key as string);
		},

		async clear(): Promise<number> {
			requireConnected("namespace().clear()");

			if (xp.dbType === "sqlite") {
				if (!sqlitePluginTableExists()) return 0;
				return (xp.database as SQLite)
					.prepare(`DELETE FROM "${PLUGIN_COLLECTION}" WHERE namespace = ?`)
					.run(namespace).changes;
			}

			const result = await (xp.database as MongoClient).db(xp.dbName)
				.collection(PLUGIN_COLLECTION)
				.deleteMany({ namespace })
				.catch(error => handleError(error, "namespace().clear()"));
			return result.deletedCount;
		}
	};
}


/**
 * Handle database errors
 * @param {Error} error
 * @param {string} functionName
 * @returns {void}
 * @private
 */
function handleError(error: Error, functionName: string): never {
	throw new XpFatal({ function: `Database.${functionName}`, message: error });
}

export function parseFlags<T extends UserResult | LevelRoleResult>(row: T): T {
	if (!row) return row;
	if ('flags' in row) {
		(row as UserResult).flags = normalizeUserFlags((row as UserResult).flags);
	}
	return row;
}

function normalizeUserWriteData(data: UserOptions["data"], includeDefaultFlags: boolean = false): UserOptions["data"] {
	const normalizedData: UserOptions["data"] = { ...data };
	const hasFlags = Object.prototype.hasOwnProperty.call(data, "flags");
	if (includeDefaultFlags || hasFlags) normalizedData.flags = normalizeUserFlags(data.flags);
	return normalizedData;
}

function normalizeUserCreateData(data: UserOptions["data"]): UserOptions["data"] {
	const normalizedData = normalizeUserWriteData(data, true);
	const normalizedUser = normalizedData.user ?? data.user;
	if (!normalizedUser) throw new XpFatal({ function: "createOne()", message: "User ID was not provided for user document creation" });

	return {
		...normalizedData,
		name: normalizedData.name ?? normalizedUser,
		level: typeof normalizedData.level === "number" ? normalizedData.level : 0,
		user: normalizedUser,
		xp: typeof normalizedData.xp === "number" ? normalizedData.xp : 0,
		xp_rate: typeof normalizedData.xp_rate === "number" ? normalizedData.xp_rate : xp.xp_rate,
	};
}

function normalizeUserFlags(flags: unknown): Array<number | string> {
	if (Array.isArray(flags)) return flags.filter((flag): flag is number | string => typeof flag === "number" || typeof flag === "string");

	if (typeof flags === "string") {
		const parsed = safeJsonParse<unknown>(flags, []);
		if (Array.isArray(parsed)) return parsed.filter((flag): flag is number | string => typeof flag === "number" || typeof flag === "string");
	}

	return [];
}

function parseLevelRoleRow(row: LevelRoleResult | Document | null): LevelRoleResult | null {
	if (!row) return null;

	const normalized = row as LevelRoleResult;
	const legacyGuild = (normalized as unknown as { gid?: string }).gid;
	if (!(normalized as { guild?: string }).guild && typeof legacyGuild === "string") {
		(normalized as { guild?: string }).guild = legacyGuild;
	}
	if (typeof normalized.levelrole === "string") {
		const parsedLevelRole = safeJsonParse<LevelRoleResult["levelrole"] | null>(normalized.levelrole, null);
		if (!parsedLevelRole) return null;
		normalized.levelrole = parsedLevelRole;
	}

	return normalized;
}

function safeJsonParse<T>(value: string, fallback: T): T {
	try {
		return JSON.parse(value) as T;
	} catch {
		return fallback;
	}
}

function getLevelRoleLevel(data: LevelRoleOptions["data"]): number | null {
	if (!data?.levelrole || typeof data.levelrole.level !== "number" || isNaN(data.levelrole.level)) return null;
	return data.levelrole.level;
}

function normalizeCollectionFilter(query: UserOptions | LevelRoleOptions): Record<string, unknown> {
	if (query.collection === "simply-xps") return query.data;

	const level = getLevelRoleLevel(query.data);
	if (level === null) return query.data as unknown as Record<string, unknown>;

	return {
		guild: query.data.guild,
		"levelrole.level": level
	};
}

/**
 * Exports the `Database` class as `db`.
 * @deprecated Use `Database` class instead, this will be removed in the near future.
 */
export const db = Database;