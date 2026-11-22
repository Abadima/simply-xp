import type { Collection, Document, MongoClient } from "mongodb";
import type { Database as SQLiteDatabase } from "better-sqlite3";
import { XpFatal } from "./xplogs";
import { xp } from "../client";

const LEGACY_SCHEMA_VERSION = 1;
const CURRENT_SCHEMA_VERSION = 2;

/**
 * Creates the SQLite tables, migrates an older layout and enforces the indexes.
 * @private
 */
export function setupSqliteSchema(db: SQLiteDatabase): void {
	const hadUserTable = Boolean(db
		.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='simply-xps'")
		.get());

	db.exec(`
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

	ensureSqliteSchemaVersion(db, hadUserTable);
	ensureSqliteUniqueness(db);
}

/**
 * Records the MongoDB schema version and enforces the indexes.
 * @private
 */
export async function setupMongoSchema(client: MongoClient): Promise<void> {
	await ensureMongoSchemaVersion(client);
	await ensureMongoIndexes(client);
}


/**
 * @private
 */
export function ensureSqliteSchemaVersion(db: SQLiteDatabase, existingDb?: boolean): void {
	const hasMetaTable = Boolean(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='simply-xp-meta'").get());
	const hasUserTable = Boolean(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='simply-xps'").get());
	const hasLevelRolesTable = Boolean(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='simply-xp-levelroles'").get());
	const isExistingDb = typeof existingDb === "boolean" ? existingDb : hasUserTable;
	const needsMigration = sqliteNeedsV2Migration(db, hasUserTable, hasLevelRolesTable);

	if (!hasMetaTable) {
		db.exec("CREATE TABLE IF NOT EXISTS \"simply-xp-meta\" (schemaVersion INTEGER NOT NULL)");
		if (!isExistingDb) {
			setSqliteSchemaVersion(db, CURRENT_SCHEMA_VERSION);
			return;
		}
		setSqliteSchemaVersion(db, needsMigration ? LEGACY_SCHEMA_VERSION : CURRENT_SCHEMA_VERSION);
	}

	if ((getSqliteSchemaVersion(db) || LEGACY_SCHEMA_VERSION) < CURRENT_SCHEMA_VERSION || needsMigration) {
		if (needsMigration) migrateSqliteToV2(db);
		setSqliteSchemaVersion(db, CURRENT_SCHEMA_VERSION);
	}
}

function getSqliteSchemaVersion(db: SQLiteDatabase): number {
	try {
		const result = db.prepare("SELECT schemaVersion FROM \"simply-xp-meta\" LIMIT 1").get() as { schemaVersion?: number } | undefined;
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
 * Records the MongoDB schema version the first time it is seen: legacy when the users collection already exists.
 * @private
 */
export async function ensureMongoSchemaVersion(client: MongoClient): Promise<void> {
	const database = client.db(xp.dbName);
	type MetaDoc = { _id: string; schemaVersion?: number };
	const metaCollection = database.collection<MetaDoc>("simply-xp-meta");

	if (!await metaCollection.findOne({ _id: "schema" })) {
		const hasUsersCollection = await database.listCollections({ name: "simply-xps" }).hasNext();
		await metaCollection.updateOne(
			{ _id: "schema" },
			{ $set: { schemaVersion: hasUsersCollection ? LEGACY_SCHEMA_VERSION : CURRENT_SCHEMA_VERSION } },
			{ upsert: true }
		);
	}
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
	});

	await removeMongoDuplicateDocuments(database.collection("simply-xp-levelroles"), {
		groupId: {
			guild: "$guild",
			level: "$levelrole.level",
		},
		match: { "levelrole.level": { $exists: true, $ne: null } },
	});
}

async function removeMongoDuplicateDocuments(
	collection: Collection<Document>,
	options: {
		groupId: Record<string, unknown>;
		match?: Record<string, unknown>;
	}
): Promise<void> {
	const pipeline: Record<string, unknown>[] = [];
	if (options.match) pipeline.push({ $match: options.match });
	pipeline.push(
		{ $addFields: { __sortTimestamp: { $ifNull: ["$lastUpdated", "$createdAt"] } } },
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
		await collection.deleteMany({ _id: { $in: duplicate.ids.slice(1) as Document["_id"][] } });
	}
}
