import { clean, convertFrom, Database, xp } from "../xp";
import { XpFatal, XpLog } from "./functions/xplogs";
import { UserResult } from "./classes/Database";
import { execSync } from "child_process";
import type { Database as SQLiteDatabase } from "better-sqlite3";
import type { MongoClient } from "mongodb";

export type ConnectionOptions = {
	auto_clean?: boolean;
	auto_create?: boolean;
	debug?: boolean;
	notify?: boolean;
	type: "mongodb" | "sqlite" | undefined;
	xp_rate?: "slow" | "normal" | "fast" | number;
}

/**
 * Connect to a database (MongoDB, SQLite)
 *
 * @async
 * @param {string} uri
 * @param {ConnectionOptions} options
 * @link `Documentation:` https://simplyxp.js.org/docs/next/functions/connect
 * @returns {Promise<boolean>}
 * @throws {XpFatal} If an invalid type is provided or if the value is not provided.
 */
export async function connect(uri: string, options: ConnectionOptions = { type: undefined }): Promise<boolean> {
	const { type, auto_create, auto_clean, notify, debug, xp_rate } = options;
	if (xp_rate && (xp_rate === "slow" || xp_rate === "normal" || xp_rate === "fast" || !isNaN(xp_rate))) xp.xp_rate = (xp_rate === "slow" ? 0.05 : xp_rate === "normal" ? 0.1 : xp_rate === "fast" ? 0.5 : xp_rate);
	if (!uri) throw new XpFatal({ function: "connect()", message: "No URI Provided" });
	if (notify === false) xp.notify = false;
	if (auto_create) xp.auto_create = true;
	if (auto_clean) xp.auto_clean = true;
	if (debug) xp.debug = true;

	if (!type) {
		options.type = "mongodb";
		XpLog.warn("connect()", "Database type not provided, defaulting to MongoDB");
	}

	switch (type) {
		case "mongodb": {
			switch (await checkPackageVersion("mongodb", 3, 7)) {
				case "too_low":
					throw new XpFatal({ function: "connect()", message: "MONGODB V3 OR NEWER IS REQUIRED" });
				case "too_high":
					XpLog.warn("connect()", "MONGODB VERSION IS NEWER THAN TESTED (V7) -- CONTINUE WITH CAUTION");
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
			if (xp.database) await ensureMongoSchemaVersion(xp.database as MongoClient);
		}

			break;
		case "sqlite":
			try {
				switch (await checkPackageVersion("better-sqlite3", 7, 12)) {
					case "too_low":
						throw new XpFatal({ function: "connect()", message: "BETTER-SQLITE3 V7 OR NEWER IS REQUIRED" });
					case "too_high":
						XpLog.warn("connect()", "BETTER-SQLITE3 VERSION IS NEWER THAN TESTED (V12) -- CONTINUE WITH CAUTION");
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
						gid       	TEXT    NOT NULL,
						levelrole   TEXT    NOT NULL,
						createdAt   DATE    NOT NULL DEFAULT (datetime('now')),
						lastUpdated DATE    NOT NULL DEFAULT (datetime('now'))
					);
				`);


				ensureSqliteSchemaVersion(xp.database as SQLiteDatabase, hadUserTable);
			} catch (error: unknown) {
				if (typeof error === "object" && error !== null) {
					const errorWithCode = error as { message: string, code?: string };
					if (errorWithCode.code !== undefined && errorWithCode.code !== "MODULE_NOT_FOUND") {
						throw new XpFatal({ function: "connect()", message: errorWithCode.message });
					}
				}
			}
			break;
		default:
			throw new XpFatal({ function: "connect()", message: "DATABASE TYPE NOT PROVIDED OR INVALID" });
	}

	if (!xp.database) return false;
	XpLog.info("connect()", "Connected to database!");
	if (auto_clean) clean({ db: true });

	// Update all users with the new XP rate
	await Database.findAll("simply-xps").then((users) => {
		(users as UserResult[]).filter((user) => user?.xp_rate !== xp.xp_rate).map((user) => {
			Database.updateOne({
				collection: "simply-xps",
				data: { user: user.user, guild: user.guild }
			}, {
				collection: "simply-xps",
				data: {
					user: user.user, guild: user.guild,
					level: convertFrom(user.xp, "xp"),
					xp: user.xp, xp_rate: xp.xp_rate
				}
			});
		});
	});

	XpLog.debug("connect()", "UPDATED ALL USERS WITH NEW XP RATE");
	return true;
}

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

	if (schemaVersion < 2 && needsMigration) {
		migrateSqliteToV2(db);
		setSqliteSchemaVersion(db, 2);
		schemaVersion = 2;
	}
	if (schemaVersion < 2 && !needsMigration) {
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
		const hasLevelRoleCreatedAt = levelRoleColumns.some((column) => column.name === "createdAt");
		const hasLevelRole = levelRoleColumns.some((column) => column.name === "levelrole");
		if (!hasLevelRoleCreatedAt || !hasLevelRole) return true;
	}

	return false;
}

function migrateSqliteToV2(db: SQLiteDatabase): void {
	const userColumns = db.prepare("PRAGMA table_info(\"simply-xps\")").all() as { name: string }[];
	if (!userColumns.some((column) => column.name === "createdAt")) {
		db.exec("ALTER TABLE \"simply-xps\" ADD COLUMN createdAt DATE NOT NULL DEFAULT (datetime('now'));");
	}

	const levelRoleColumns = db.prepare("PRAGMA table_info(\"simply-xp-levelroles\")").all() as { name: string }[];
	const hasLevelRole = levelRoleColumns.some((column) => column.name === "levelrole");
	const hasLvlRole = levelRoleColumns.some((column) => column.name === "lvlrole");

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

export async function ensureMongoSchemaVersion(client: MongoClient): Promise<number> {
	const database = client.db();
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
 * Returns the package manager used
 * @private
 * @returns {Promise<"yarn" | "npm" | "pnpm">}
 */
async function getPackageManager(): Promise<"yarn" | "npm" | "pnpm"> {
	const { existsSync } = await import("fs");

	const lockfiles = {
		"yarn.lock": "yarn",
		"pnpm-lock.yaml": "pnpm",
		"pnpm-lock.json": "pnpm",
		"package-lock.json": "npm",
	} as const;

	for (const [file, manager] of Object.entries(lockfiles)) {
		if (existsSync(file)) {
			XpLog.debug("getPackageManager()", `Using ${manager.toUpperCase()}`);
			return manager;
		}
	}
	XpLog.debug("getPackageManager()", "No lockfile found, defaulting to NPM");
	return "npm";
}

/**
 * Check database package versions
 * @private
 * @param {string} type - NPM Package Name (lowercase)
 * @param {number} min - Minimum Major Version Number
 * @param {number} max - Maximum Major Version Number (Optional)
 * @returns {Promise<"too_low" | "ok" | "too_high">} - Version Status
 * @throws {XpFatal} If the package version is not supported
 */
export async function checkPackageVersion(type: string, min: number, max?: number): Promise<"too_low" | "ok" | "too_high"> {
	try {
		const chosenPackage = await import(`${type}/package.json`);
		const majorVersion = parseInt(chosenPackage.version.split(".")[0], 10);

		if (majorVersion < min) return "too_low";
		if (max && majorVersion > max) return "too_high";
		return "ok";
	} catch (_) {
		XpLog.info("checkPackageVersion()", `Installing ${type} [V${max || min}] | Please wait...`);

		execSync(`${await getPackageManager()} add ${type}@${max || min}.x.x`);
		XpLog.warn("checkPackageVersion()", `Installed ${type}. Please restart!`);
		return process.exit(0);
	}
}