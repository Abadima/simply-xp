import { LEVEL_FROM_XP_SQL, levelFromXpExpr } from "./functions/curve";
import { mongo, mongoCollection, sqlite } from "./functions/db";
import { ensureMongoSchemaVersion, ensureSqliteSchemaVersion, setupMongoSchema, setupSqliteSchema } from "./functions/schema";
import { requireSupportedAdapter } from "./functions/adapters";
import type { Database as SQLiteDatabase } from "better-sqlite3";
import type { Document, MongoClient } from "mongodb";
import { optionsOf, requireValue } from "./functions/guards";
import { XpFatal, XpLog } from "./functions/xplogs";
import { clearCanvasCache } from "./functions/canvas";
import { isRecord } from "./functions/predicates";
import { xp } from "./client";

export type ConnectionOptions = {
	auto_create?: boolean;
	debug?: boolean;
	notify?: boolean;
	type?: "mongodb" | "sqlite";
	xp_rate?: "slow" | "normal" | "fast" | number;
}

/**
 * Options for clean function.
 * @property {boolean} [db=false] - Whether to clean the database or not.
 * @link `Documentation:` https://simplyxp.js.org/docs/clean
 */
type CleanOptions = { db?: boolean };

/**
 * Helps to clean the database and cache, more in the future, maybe.
 * @param {CleanOptions} [options={}] - The options.
 * @param {boolean?} options.db - Whether to clean the database or not.
 * @link `Documentation:` https://simplyxp.js.org/docs/clean
 * @returns {Promise<void> | void} - A promise when `db` is set (it resolves once the database is cleaned), otherwise nothing.
 */
export function clean(options: CleanOptions & { db: true }): Promise<void>;
export function clean(options?: CleanOptions): void;
export function clean(options: CleanOptions = {}): Promise<void> | void {
	clearCanvasCache();
	XpLog.debug("clean()", "CLEARED CANVAS CACHE");

	if (!optionsOf(options).db || !xp.database) return;

	return cleanZeroedUsers();
}

async function cleanZeroedUsers(): Promise<void> {
	try {
		switch (xp.dbType) {
			case "mongodb":
				await mongoCollection("simply-xps").deleteMany({ level: 0, xp: 0 });
				break;

			case "sqlite":
				sqlite().prepare("DELETE FROM \"simply-xps\" WHERE level = 0 AND xp = 0").run();
				break;
		}

		XpLog.debug("clean()", "REMOVED ALL USERS WITHOUT XP");
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		XpLog.warn("clean()", `Database cleanup failed: ${message}`);
	}
}

/**
 * Connect to a database (MongoDB, SQLite)
 *
 * @async
 * @param {string} uri
 * @param {ConnectionOptions} options
 * @link `Documentation:` https://simplyxp.js.org/docs/functions/connect
 * @returns {Promise<boolean>}
 * @throws {XpFatal} If an invalid type is provided or if the value is not provided.
 * @throws {XpFatal} `SX_ADAPTER_MISSING` when the selected adapter package is not installed.
 */
export async function connect(uri: string, options: ConnectionOptions = {}): Promise<boolean> {
	const { type } = options;
	applySettings("connect()", options);
	if (!uri) throw new XpFatal({ function: "connect()", message: "No URI Provided" });

	if (!type) XpLog.warn("connect()", "Database type not provided, defaulting to MongoDB");

	switch (type ?? "mongodb") {
		case "mongodb": {
			await requireSupportedAdapter("connect()", "mongodb");

			XpLog.debug("[connect()]", `ATTEMPTING MONGODB CONNECTION`);
			const { MongoClient } = await import("mongodb");

			const client = await MongoClient.connect(uri).catch((error) => {
				throw new XpFatal({ function: "connect()", message: error.message });
			});

			xp.dbType = "mongodb";
			xp.database = client;
			xp.dbName = client.db().databaseName;
			await setupMongoSchema(client);
			break;
		}

		case "sqlite":
			await requireSupportedAdapter("connect()", "sqlite");

			try {
				xp.database = new (await import("better-sqlite3")).default(uri);
				XpLog.info("[connect()]", "Successfully connected to SQLite database.");
				xp.dbType = "sqlite";
				setupSqliteSchema(sqlite());
			} catch (error: unknown) {
				const details = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
				throw new XpFatal({ function: "connect()", message: `SQLite connection/setup failed: ${details}` });
			}
			break;

		default:
			throw new XpFatal({ function: "connect()", message: "DATABASE TYPE NOT PROVIDED OR INVALID" });
	}

	XpLog.info("connect()", "Connected to database!");
	await refreshUsers("connect()");
	return true;
}

function applySettings(caller: string, { auto_create, debug, notify, xp_rate }: ConnectionOptions): void {
	if (xp_rate !== undefined) xp.xp_rate = resolveXpRate(caller, xp_rate);
	if (typeof notify === "boolean") xp.notify = notify;
	if (typeof auto_create === "boolean") xp.auto_create = auto_create;
	if (typeof debug === "boolean") xp.debug = debug;
}

/** Drops users without any XP, then brings every user's level in line with the current XP rate. */
async function refreshUsers(caller: string): Promise<void> {
	await clean({ db: true });
	await syncUsersXpRate(caller);
}

function resolveXpRate(functionName: string, rate: "slow" | "normal" | "fast" | number): number {
	if (rate === "slow") return 0.05;
	if (rate === "normal") return 0.1;
	if (rate === "fast") return 0.5;

	if (!Number.isFinite(rate) || rate <= 0) {
		throw new XpFatal({ function: functionName, message: "xp_rate must be a finite number greater than 0" });
	}

	return rate;
}

async function syncUsersXpRate(caller: string): Promise<void> {
	if (!xp.database) return;
	const now = new Date().toISOString();

	switch (xp.dbType) {
		case "mongodb":
			await mongoCollection("simply-xps")
				.updateMany(
					{
						$or: [
							{ xp_rate: { $exists: false } },
							{ xp_rate: { $ne: xp.xp_rate } },
						],
					},
					[{
						$set: {
							lastUpdated: now,
							level: levelFromXpExpr({ $max: [0, { $ifNull: ["$xp", 0] }] }),
							xp_rate: xp.xp_rate,
						}
					}] as unknown as Document[]
				);
			break;

		case "sqlite":
			sqlite()
				.prepare(`
					UPDATE "simply-xps"
					SET
						level = ${LEVEL_FROM_XP_SQL},
						xp_rate = ?,
						lastUpdated = ?
					WHERE xp_rate IS NULL OR xp_rate != ?
				`)
				.run(xp.xp_rate, xp.xp_rate, now, xp.xp_rate);
			break;

	}

	XpLog.debug(caller, "UPDATED USERS WITH NEW XP RATE WHERE MISMATCHED");
}

/**
 * Options for the XP client.
 * @property {boolean} auto_create - Whether to automatically create a user if they don't exist in the database.
 * @property {object} dbOptions - The database options.
 * @property {"mongodb" | "sqlite"} dbOptions.type - The database type.
 * @property {MongoClient | Database} dbOptions.database - The database connection.
 * @property {string} [dbOptions.name] - MongoDB only: explicit database name. If set, overrides the default derived from the connection URI.
 * @property {boolean} debug - Whether to enable debug logs.
 * @property {boolean} notify - Enable/Disable console notifications.
 * @property {"slow" | "normal" | "fast" | number} xp_rate - The XP rate.
 */
interface NewClientOptions {
	auto_create?: boolean;
	dbOptions?: { type: "mongodb", database: MongoClient, name?: string } | { type: "sqlite", database: SQLiteDatabase };
	debug?: boolean;
	notify?: boolean;
	xp_rate?: "slow" | "normal" | "fast" | number;
}

/**
 * Updates the options of the XP client.
 * @param {NewClientOptions} clientOptions - The new options to update.
 * @link `Documentation:` https://simplyxp.js.org/docs/Functions/updateOptions
 * @returns {Promise<void>} - Resolves once the options are applied and users are re-synced.
 * @throws {XpFatal} If an invalid option is provided.
 */
export async function updateOptions(clientOptions: NewClientOptions): Promise<void> {
	requireValue("updateOptions()", clientOptions, "Options were not provided");
	if (!isRecord(clientOptions)) throw new XpFatal({ function: "updateOptions()", message: "Options must be an object" });

	applySettings("updateOptions()", clientOptions);

	// Comes from JavaScript callers too, so it is checked as `unknown`.
	const { type, database, name } = (clientOptions.dbOptions ?? {}) as { type?: unknown; database?: unknown; name?: unknown };
	if (type && database) {
		if (type !== "mongodb" && type !== "sqlite") throw new XpFatal({
			function: "updateOptions()", message: "Invalid database type provided"
		});

		xp.dbType = type;
		xp.database = database as MongoClient | SQLiteDatabase;
		if (type === "mongodb") {
			xp.dbName = name as string | undefined;
			if (!xp.dbName) throw new XpFatal({
				function: "updateOptions()", message: "MongoDB requires dbOptions.name so simply-xp knows which database to use"
			});
		}

		await requireSupportedAdapter("updateOptions()", type);

		if (type === "mongodb") {
			try {
				await mongo().db(xp.dbName).command({ ping: 1 });
				await ensureMongoSchemaVersion(mongo());
			} catch {
				xp.database = undefined;
				throw new XpFatal({ function: "updateOptions()", message: "Invalid MongoDB connection" });
			}
		} else {
			try {
				sqlite().prepare("SELECT 1").get();
				ensureSqliteSchemaVersion(sqlite());
			} catch {
				throw new XpFatal({ function: "updateOptions()", message: "Invalid SQLite connection" });
			}
		}
	}

	await refreshUsers("updateOptions()");
}
