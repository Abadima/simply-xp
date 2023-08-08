import {XpFatal, XpLog} from "./functions/xplogs";
import {execSync} from "child_process";
import {xp} from "../xp";

export type ConnectionOptions = {
	type: "mongodb" | "sqlite" | undefined;
	auto_create?: boolean;
	auto_purge?: boolean;
	notify?: boolean;
	debug?: boolean;
}

/**
 * Connect to a database (MongoDB, SQLite)
 *
 * @async
 * @param {string} uri
 * @param {ConnectionOptions} options
 * @link `Documentation:` https://simplyxp.js.org/docs/connect
 * @returns {Promise<boolean>}
 * @throws {XpFatal} If an invalid type is provided or if the value is not provided.
 */
export async function connect(uri: string, options: ConnectionOptions = {type: undefined}): Promise<boolean | void> {
	const {type, auto_create, auto_purge, notify, debug} = options;
	if (!uri) throw new XpFatal({function: "connect()", message: "No URI Provided"});
	if (notify === false) xp.notify = false;
	if (auto_create) xp.auto_create = true;
	if (auto_purge) xp.auto_purge = true;
	if (debug) xp.debug = true;

	if (!type) {
		options.type = "mongodb";
		XpLog.warn("connect()", "Database type not provided, defaulting to MongoDB");
	}

	switch (type) {
	case "mongodb": {
		const {MongoClient} = await import("mongodb"), goodVersion = await checkPackageVersion("mongodb");
		if (!goodVersion) return XpLog.err("connect()", "MongoDB V4 or higher is required");

		const client = await MongoClient.connect(uri).catch((error) => {
			throw new XpFatal({function: "connect()", message: error.message});
		});
		xp.dbType = "mongodb";
		xp.database = client || undefined;
	}

		break;
	case "sqlite":
		try {
			const [betterSqlite3, goodVersion] = await Promise.all([
				import("better-sqlite3"), checkPackageVersion("sqlite")
			]);

			if (!goodVersion) return XpLog.err("connect()", "better-sqlite3 V7 or higher is required");

			xp.database = new betterSqlite3.default(uri);
			xp.dbType = "sqlite";

			xp.database.exec(`CREATE TABLE IF NOT EXISTS "simply-xps"
                              (
                                  user  TEXT NOT NULL,
                                  guild TEXT NOT NULL,
                                  name  TEXT    DEFAULT "Unknown",
                                  level INTEGER DEFAULT 0,
                                  xp    INTEGER DEFAULT 0
                              )`
			);
			xp.database.exec(`CREATE TABLE IF NOT EXISTS "simply-xp-levelroles"
                              (
                                  gid     TEXT UNIQUE,
                                  lvlrole TEXT NOT NULL
                              )`
			);
		} catch (error: unknown) {
			if (typeof error === "object" && error !== null) {
				const errorWithCode = error as { message: string, code?: string };
				if (errorWithCode.code !== undefined && errorWithCode.code !== "MODULE_NOT_FOUND") {
					throw new XpFatal({function: "connect()", message: errorWithCode.message});
				}
			}
		}
		break;
	default:
		throw new XpFatal({function: "connect()", message: "DATABASE TYPE NOT PROVIDED OR INVALID"});
	}

	if (!xp.database) return false;
	XpLog.info("connect()", "Connected to database!");
	return true;
}

/**
 * Returns the package manager used
 * @private
 * @returns {Promise<"yarn" | "npm" | "pnpm">}
 */
async function getPackageManager(): Promise<"yarn" | "npm" | "pnpm"> {
	const {existsSync} = await import("fs");

	const lockfiles = ["yarn.lock", "pnpm-lock.yaml", "pnpm-lock.json", "package-lock.json"];
	const foundLockfiles = lockfiles.filter((lockfile) => existsSync(lockfile));

	if (foundLockfiles.length === 1) {
		if (foundLockfiles[0] === "yarn.lock") {
			XpLog.debug("getPackageManager()", "Using Yarn");
			return "yarn";
		} else if (foundLockfiles[0] === "pnpm-lock.yaml" || foundLockfiles[0] === "pnpm-lock.json") {
			XpLog.debug("getPackageManager()", "Using PNPM");
			return "pnpm";
		}
	}
	XpLog.debug("getPackageManager()", "Using NPM");
	return "npm";
}

/**
 * Check database package versions
 * @private
 * @param {"mongodb" | "sqlite"} type
 * @returns {Promise<boolean>}
 * @throws {XpFatal} If the package version is not supported
 */
export async function checkPackageVersion(type: "mongodb" | "sqlite"): Promise<boolean> {
	switch (type) {
	case "mongodb":
		try {
			const mongoPackage = await import("mongodb/package.json");
			return parseInt(mongoPackage.version.substring(0, 1)) >= 4;
		} catch (_) {
			XpLog.info("checkPackageVersion()", "Installing MongoDB [5.x] | Please wait...");
			execSync(`${await getPackageManager()} add mongodb@5.x.x`);
			XpLog.warn("checkPackageVersion()", "Installed MongoDB. Please restart!");
			return process.exit(1);
		}

	case "sqlite":
		try {
			const sqlitePackage = await import("better-sqlite3/package.json");
			return parseInt(sqlitePackage.version.substring(0, 1)) >= 7;
		} catch (_) {
			XpLog.info("checkPackageVersion()", "Installing better-sqlite3 [V8] | Please wait...");
			execSync(`${await getPackageManager()} add better-sqlite3@8.x.x`);
			XpLog.warn("checkPackageVersion()", "Installed better-sqlite3. Please restart!");
			return process.exit(1);
		}
	}
}