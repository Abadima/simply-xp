import type { Collection, Document, MongoClient } from "mongodb";
import type { Database as SQLiteDatabase } from "better-sqlite3";
import { XpFatal, XpLog } from "./functions/xplogs";
import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { clean, xp } from "../xp";

export type ConnectionOptions = {
	auto_create?: boolean;
	debug?: boolean;
	notify?: boolean;
	type?: "mongodb" | "sqlite";
	xp_rate?: "slow" | "normal" | "fast" | number;
}

/**
 * Supported major version range for each database adapter.
 * @private
 */
export const ADAPTER_VERSION_RANGES = {
	"better-sqlite3": { min: 7, max: 13 },
	mongodb: { min: 4, max: 7 },
} as const;

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
	const { type, auto_create, notify, debug, xp_rate } = options;
	if (xp_rate !== undefined) xp.xp_rate = resolveXpRate("connect()", xp_rate);
	if (!uri) throw new XpFatal({ function: "connect()", message: "No URI Provided" });
	if (typeof notify === "boolean") xp.notify = notify;
	if (typeof auto_create === "boolean") xp.auto_create = auto_create;
	if (typeof debug === "boolean") xp.debug = debug;
	const resolvedType = type ?? "mongodb";

	if (!type) {
		XpLog.warn("connect()", "Database type not provided, defaulting to MongoDB");
	}

	switch (resolvedType) {
		case "mongodb": {
			assertAdapterInstalled("mongodb", "MongoDB", "npm install mongodb");
			switch (await checkPackageVersion("mongodb", ADAPTER_VERSION_RANGES.mongodb.min, ADAPTER_VERSION_RANGES.mongodb.max)) {
				case "too_low":
					throw new XpFatal({ function: "connect()", message: `MONGODB V${ADAPTER_VERSION_RANGES.mongodb.min} OR NEWER IS REQUIRED` });
				case "too_high":
					XpLog.warn("connect()", `MONGODB VERSION IS NEWER THAN TESTED (V${ADAPTER_VERSION_RANGES.mongodb.max}) -- CONTINUE WITH CAUTION`);
					break;
				case "ok":
					XpLog.debug("connect()", "MongoDB is natively compatible with our package! 🎉");
			}

			XpLog.debug("[connect()]", `ATTEMPTING MONGODB CONNECTION`);
			const { MongoClient } = await import("mongodb");

			const client = await MongoClient.connect(uri).catch((error) => {
				throw new XpFatal({ function: "connect()", message: error.message });
			});

			xp.dbType = "mongodb";
			xp.database = client || undefined;
			xp.dbName = client.db().databaseName;
			if (xp.database) {
				await ensureMongoSchemaVersion(xp.database as MongoClient);
				await ensureMongoIndexes(xp.database as MongoClient);
			}
		}

			break;
		case "sqlite":
			try {
				assertAdapterInstalled("better-sqlite3", "SQLite", "npm install better-sqlite3");
				switch (await checkPackageVersion("better-sqlite3", ADAPTER_VERSION_RANGES["better-sqlite3"].min, ADAPTER_VERSION_RANGES["better-sqlite3"].max)) {
					case "too_low":
						throw new XpFatal({ function: "connect()", message: `BETTER-SQLITE3 V${ADAPTER_VERSION_RANGES["better-sqlite3"].min} OR NEWER IS REQUIRED` });
					case "too_high":
						XpLog.warn("connect()", `BETTER-SQLITE3 VERSION IS NEWER THAN TESTED (V${ADAPTER_VERSION_RANGES["better-sqlite3"].max}) -- CONTINUE WITH CAUTION`);
						break;
					case "ok":
						XpLog.debug("connect()", "better-sqlite3 is natively compatible with our package! 🎉");
				}

				xp.database = new (await import("better-sqlite3")).default(uri);
				XpLog.info("[connect()]", "Successfully connected to SQLite database.");
				xp.dbType = "sqlite";
				const hadUserTable = Boolean((xp.database as SQLiteDatabase)
					.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='simply-xps'")
					.get());

				xp.database.exec(`
					CREATE TABLE IF NOT EXISTS "simply-xps" (
						user        TEXT    NOT NULL,
						guild       TEXT    NOT NULL,
						name        TEXT    NOT NULL DEFAULT user,
						level       INTEGER NOT NULL DEFAULT 0,
						flags       TEXT             DEFAULT NULL,
						xp          INTEGER NOT NULL DEFAULT 0,
						voice_xp    INTEGER          DEFAULT 0,
						voice_time  INTEGER          DEFAULT 0,
						xp_rate     INTEGER          DEFAULT 0.1,
						createdAt   DATE    NOT NULL DEFAULT (datetime('now')),
						lastUpdated DATE    NOT NULL DEFAULT (datetime('now'))
					);

					CREATE TABLE IF NOT EXISTS "simply-xp-levelroles" (
						guild      	TEXT    NOT NULL,
						levelrole   TEXT    NOT NULL,
						createdAt   DATE    NOT NULL DEFAULT (datetime('now')),
						lastUpdated DATE    NOT NULL DEFAULT (datetime('now'))
					);
				`);


				ensureSqliteSchemaVersion(xp.database as SQLiteDatabase, hadUserTable);
				ensureSqliteUniqueness(xp.database as SQLiteDatabase);
			} catch (error: unknown) {
				const details = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
				throw new XpFatal({ function: "connect()", message: `SQLite connection/setup failed: ${details}` });
			}
			break;
		default:
			throw new XpFatal({ function: "connect()", message: "DATABASE TYPE NOT PROVIDED OR INVALID" });
	}

	if (!xp.database) return false;
	XpLog.info("connect()", "Connected to database!");
	await clean({ db: true });
	await syncUsersXpRate("connect()");
	return true;
}

function assertAdapterInstalled(packageName: string, adapterName: string, installCommand: string): void {
	if (!findInstalledPackageJsonPath(packageName)) {
		const message = `Missing required package "${packageName}". simply-xp needs it to connect to ${adapterName}. Install it with: ${installCommand}`;
		throw new XpFatal({
			code: "SX_ADAPTER_MISSING",
			function: "connect()",
			message,
		});
	}
}

function findInstalledPackageJsonPath(packageName: string): string | null {
	let currentDir: string;

	try {
		currentDir = dirname(require.resolve(packageName));
	} catch {
		return null;
	}

	while (true) {
		const packageJsonPath = join(currentDir, "package.json");
		if (existsSync(packageJsonPath)) {
			try {
				const metadata = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { name?: string };
				if (metadata.name === packageName) return packageJsonPath;
			} catch {
				return null;
			}
		}

		const parentDir = dirname(currentDir);
		if (parentDir === currentDir) return null;
		currentDir = parentDir;
	}
}

function readInstalledPackageVersion(packageName: string): string | null {
	const packageJsonPath = findInstalledPackageJsonPath(packageName);
	if (!packageJsonPath) return null;

	try {
		const metadata = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { version?: string };
		return typeof metadata.version === "string" ? metadata.version : null;
	} catch {
		return null;
	}
}

/**
 * @private
 */
export function ensureSqliteSchemaVersion(db: SQLiteDatabase, existingDb?: boolean): number {
	const hasMetaTable = Boolean(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='simply-xp-meta'").get());
	const hasUserTable = Boolean(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='simply-xps'").get());
	const hasLevelRolesTable = Boolean(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='simply-xp-levelroles'").get());
	const isExistingDb = typeof existingDb === "boolean" ? existingDb : hasUserTable;
	const needsMigration = sqliteNeedsV2Migration(db, hasUserTable, hasLevelRolesTable);

	if (!hasMetaTable) {
		db.exec("CREATE TABLE IF NOT EXISTS \"simply-xp-meta\" (schemaVersion INTEGER NOT NULL)");
		if (!isExistingDb) {
			setSqliteSchemaVersion(db, 2);
			return 2;
		}
		setSqliteSchemaVersion(db, needsMigration ? 1 : 2);
	}

	let schemaVersion = getSqliteSchemaVersion(db) || 1;

	if (schemaVersion < 2 || needsMigration) {
		if (needsMigration) migrateSqliteToV2(db);
		setSqliteSchemaVersion(db, 2);
		schemaVersion = 2;
	}

	return schemaVersion;
}

function getSqliteSchemaVersion(db: SQLiteDatabase): number {
	try {
		const result = db.prepare("SELECT schemaVersion FROM \"simply-xp-meta\" LIMIT 1").get() as { schemaVersion?: number };
		return typeof result?.schemaVersion === "number" ? result.schemaVersion : 0;
	} catch {
		return 0;
	}
}

function setSqliteSchemaVersion(db: SQLiteDatabase, version: number): void {
	const exists = db.prepare("SELECT 1 FROM \"simply-xp-meta\" LIMIT 1").get();
	if (exists) db.prepare("UPDATE \"simply-xp-meta\" SET schemaVersion = ?").run(version);
	else db.prepare("INSERT INTO \"simply-xp-meta\" (schemaVersion) VALUES (?)").run(version);
}

function sqliteNeedsV2Migration(db: SQLiteDatabase, hasUserTable: boolean, hasLevelRolesTable: boolean): boolean {
	if (hasUserTable) {
		const userColumns = db.prepare("PRAGMA table_info(\"simply-xps\")").all() as { name: string }[];
		const hasUserCreatedAt = userColumns.some((column) => column.name === "createdAt");
		if (!hasUserCreatedAt) return true;
	}

	if (hasLevelRolesTable) {
		const levelRoleColumns = db.prepare("PRAGMA table_info(\"simply-xp-levelroles\")").all() as { name: string }[];
		const hasLevelRoleGuild = levelRoleColumns.some((column) => column.name === "guild");
		const hasLevelRoleCreatedAt = levelRoleColumns.some((column) => column.name === "createdAt");
		const hasLevelRole = levelRoleColumns.some((column) => column.name === "levelrole");
		if (!hasLevelRoleGuild || !hasLevelRoleCreatedAt || !hasLevelRole) return true;
	}

	return false;
}

function migrateSqliteToV2(db: SQLiteDatabase): void {
	const userColumns = db.prepare("PRAGMA table_info(\"simply-xps\")").all() as { name: string }[];
	if (!userColumns.some((column) => column.name === "createdAt")) {
		db.exec("ALTER TABLE \"simply-xps\" ADD COLUMN createdAt DATE NOT NULL DEFAULT (datetime('now'));");
	}

	const levelRoleColumns = db.prepare("PRAGMA table_info(\"simply-xp-levelroles\")").all() as { name: string }[];
	const hasGuild = levelRoleColumns.some((column) => column.name === "guild");
	const hasGid = levelRoleColumns.some((column) => column.name === "gid");
	const hasLevelRole = levelRoleColumns.some((column) => column.name === "levelrole");
	const hasLvlRole = levelRoleColumns.some((column) => column.name === "lvlrole");

	if (!hasGuild && hasGid) {
		try {
			db.exec("ALTER TABLE \"simply-xp-levelroles\" RENAME COLUMN gid TO guild;");
		} catch {
			db.exec("ALTER TABLE \"simply-xp-levelroles\" ADD COLUMN guild TEXT;");
			try {
				db.exec("UPDATE \"simply-xp-levelroles\" SET guild = gid WHERE guild IS NULL OR guild = '';");
			} catch { }
		}
	} else if (!hasGuild && !hasGid) {
		db.exec("ALTER TABLE \"simply-xp-levelroles\" ADD COLUMN guild TEXT;");
	}

	if (!levelRoleColumns.some((column) => column.name === "createdAt")) {
		db.exec("ALTER TABLE \"simply-xp-levelroles\" ADD COLUMN createdAt DATE NOT NULL DEFAULT (datetime('now'));");
	}

	if (!hasLevelRole && hasLvlRole) {
		try {
			db.exec("ALTER TABLE \"simply-xp-levelroles\" RENAME COLUMN lvlrole TO levelrole;");
		} catch {
			db.exec("ALTER TABLE \"simply-xp-levelroles\" ADD COLUMN levelrole TEXT NOT NULL DEFAULT '{}';");
			try {
				db.exec("UPDATE \"simply-xp-levelroles\" SET levelrole = lvlrole WHERE levelrole IS NULL OR levelrole = '{}';");
			} catch { }
		}
	} else if (!hasLevelRole && !hasLvlRole) {
		db.exec("ALTER TABLE \"simply-xp-levelroles\" ADD COLUMN levelrole TEXT NOT NULL DEFAULT '{}';");
	}
}

/**
 * Ensures the MongoDB schema version is set and up to date, performs necessary migrations if required
 * @private
 */
export async function ensureMongoSchemaVersion(client: MongoClient): Promise<number> {
	const database = client.db(xp.dbName);
	type MetaDoc = { _id: string; schemaVersion?: number };
	const metaCollection = database.collection<MetaDoc>("simply-xp-meta");
	const metaDoc = await metaCollection.findOne({ _id: "schema" });

	if (!metaDoc) {
		const hasUsersCollection = await database.listCollections({ name: "simply-xps" }).hasNext();
		const schemaVersion = hasUsersCollection ? 1 : 2;
		await metaCollection.updateOne(
			{ _id: "schema" },
			{ $set: { schemaVersion } },
			{ upsert: true }
		);
		return schemaVersion;
	}

	return typeof metaDoc.schemaVersion === "number" ? metaDoc.schemaVersion : 1;
}

/**
 * Check database package versions
 * @private
 * @param {string} type - NPM Package Name (lowercase)
 * @param {number} min - Minimum Major Version Number
 * @param {number} max - Maximum Major Version Number (Optional)
 * @returns {Promise<"too_low" | "ok" | "too_high">} - Version Status
 * @throws {XpFatal} If the package version is not supported
 * @throws {XpFatal} `SX_ADAPTER_MISSING` when the package is not installed.
 */
export async function checkPackageVersion(type: string, min: number, max?: number): Promise<"too_low" | "ok" | "too_high"> {
	const installedVersion = readInstalledPackageVersion(type);
	if (!installedVersion) {
		const installCommand = type === "mongodb" ? "npm install mongodb" : `npm install ${type}`;
		const adapterName = type === "mongodb" ? "MongoDB" : type;
		const message = `Missing required package "${type}". simply-xp needs it to connect to ${adapterName}. Install it with: ${installCommand}`;
		throw new XpFatal({
			code: "SX_ADAPTER_MISSING",
			function: "checkPackageVersion()",
			message,
		});
	}

	const versionSegments = installedVersion.split(".");
	const majorVersion = parseInt(versionSegments[0] ?? "", 10);
	if (majorVersion < min) return "too_low";
	if (max && majorVersion > max) return "too_high";
	return "ok";
}

function ensureSqliteUniqueness(db: SQLiteDatabase): void {
	remediateSqliteDuplicates(db);

	try {
		db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_simply_xps_guild_user ON \"simply-xps\" (guild, user)").run();
		db.prepare("CREATE INDEX IF NOT EXISTS idx_simply_xps_guild_xp ON \"simply-xps\" (guild, xp DESC)").run();
		db.prepare("CREATE INDEX IF NOT EXISTS idx_simply_xps_global_xp ON \"simply-xps\" (xp DESC)").run();
		db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_simply_xp_levelroles_guild_level ON \"simply-xp-levelroles\" (guild, json_extract(levelrole, '$.level'))").run();
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown SQLite index creation failure";
		throw new XpFatal({ function: "connect()", message: `Failed to enforce SQLite indexes after duplicate remediation. ${message}` });
	}
}

async function ensureMongoIndexes(client: MongoClient): Promise<void> {
	const database = client.db(xp.dbName);
	await remediateMongoDuplicates(client);

	try {
		await database.collection("simply-xps").createIndex(
			{ guild: 1, user: 1 },
			{ unique: true, name: "idx_simply_xps_guild_user" }
		);
		await database.collection("simply-xps").createIndex(
			{ guild: 1, xp: -1 },
			{ name: "idx_simply_xps_guild_xp" }
		);
		await database.collection("simply-xps").createIndex(
			{ xp: -1 },
			{ name: "idx_simply_xps_global_xp" }
		);
		await database.collection("simply-xp-levelroles").createIndex(
			{ guild: 1, "levelrole.level": 1 },
			{ unique: true, name: "idx_simply_xp_levelroles_guild_level" }
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown MongoDB index creation failure";
		throw new XpFatal({ function: "connect()", message: `Failed to enforce MongoDB indexes after duplicate remediation. ${message}` });
	}
}

function remediateSqliteDuplicates(db: SQLiteDatabase): void {
	db.exec(`
		DELETE FROM "simply-xps"
		WHERE rowid IN (
			SELECT rowid FROM (
				SELECT rowid,
				ROW_NUMBER() OVER (
					PARTITION BY guild, user
					ORDER BY COALESCE(lastUpdated, createdAt, '') DESC, rowid DESC
				) AS rn
				FROM "simply-xps"
			)
			WHERE rn > 1
		);

		DELETE FROM "simply-xp-levelroles"
		WHERE rowid IN (
			SELECT rowid FROM (
				SELECT rowid,
				ROW_NUMBER() OVER (
					PARTITION BY guild, json_extract(levelrole, '$.level')
					ORDER BY COALESCE(lastUpdated, createdAt, '') DESC, rowid DESC
				) AS rn
				FROM "simply-xp-levelroles"
				WHERE json_extract(levelrole, '$.level') IS NOT NULL
			)
			WHERE rn > 1
		);
	`);
}

async function remediateMongoDuplicates(client: MongoClient): Promise<void> {
	const database = client.db(xp.dbName);
	await removeMongoDuplicateDocuments(database.collection("simply-xps"), {
		groupId: {
			guild: "$guild",
			user: "$user",
		},
		sortTimestamp: { $ifNull: ["$lastUpdated", "$createdAt"] },
	});

	await removeMongoDuplicateDocuments(database.collection("simply-xp-levelroles"), {
		groupId: {
			guild: "$guild",
			level: "$levelrole.level",
		},
		sortTimestamp: { $ifNull: ["$lastUpdated", "$createdAt"] },
		match: { "levelrole.level": { $exists: true, $ne: null } },
	});
}

async function removeMongoDuplicateDocuments(
	collection: Collection<Document>,
	options: {
		groupId: Record<string, unknown>;
		sortTimestamp: Record<string, unknown>;
		match?: Record<string, unknown>;
	}
): Promise<void> {
	const pipeline: Record<string, unknown>[] = [];
	if (options.match) pipeline.push({ $match: options.match });
	pipeline.push(
		{ $addFields: { __sortTimestamp: options.sortTimestamp } },
		{ $sort: { __sortTimestamp: -1, _id: -1 } },
		{
			$group: {
				_id: options.groupId,
				ids: { $push: "$_id" },
				count: { $sum: 1 },
			}
		},
		{ $match: { count: { $gt: 1 } } }
	);

	const duplicates = await collection.aggregate(pipeline).toArray() as Array<{ ids: unknown[] }>;
	for (const duplicate of duplicates) {
		const staleIds = duplicate.ids.slice(1);
		if (staleIds.length > 0) {
			await collection.deleteMany({ _id: { $in: staleIds as Document["_id"][] } });
		}
	}
}

export function resolveXpRate(functionName: string, rate: "slow" | "normal" | "fast" | number): number {
	if (rate === "slow") return 0.05;
	if (rate === "normal") return 0.1;
	if (rate === "fast") return 0.5;

	if (!Number.isFinite(rate) || rate <= 0) {
		throw new XpFatal({ function: functionName, message: "xp_rate must be a finite number greater than 0" });
	}

	return rate;
}

export async function syncUsersXpRate(caller: string): Promise<void> {
	if (!xp.database) return;
	const now = new Date().toISOString();

	switch (xp.dbType) {
		case "mongodb":
			await (xp.database as MongoClient)
				.db(xp.dbName)
				.collection("simply-xps")
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
							level: {
								$floor: {
									$multiply: [
										xp.xp_rate,
										{ $sqrt: { $max: [0, { $ifNull: ["$xp", 0] }] } }
									]
								}
							},
							xp_rate: xp.xp_rate,
						}
					}] as unknown as Document[]
				);
			break;

		case "sqlite":
			(xp.database as SQLiteDatabase)
				.prepare(`
					UPDATE "simply-xps"
					SET
						level = CAST(floor(? * sqrt(CASE WHEN COALESCE(xp, 0) < 0 THEN 0 ELSE COALESCE(xp, 0) END)) AS INTEGER),
						xp_rate = ?,
						lastUpdated = ?
					WHERE xp_rate IS NULL OR xp_rate != ?
				`)
				.run(xp.xp_rate, xp.xp_rate, now, xp.xp_rate);
			break;

		default:
			return;
	}

	XpLog.debug(caller, "UPDATED USERS WITH NEW XP RATE WHERE MISMATCHED");
}