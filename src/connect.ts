import { XpFatal, XpLog } from "./functions/xplogs";
import { execSync } from "child_process";
import { clean, convertFrom, db, xp } from "../xp";
import { UserResult } from "./functions/database";

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
		const { MongoClient } = await import("mongodb"), goodVersion = await checkPackageVersion("mongodb", 3, 6);
		if (!goodVersion) return XpLog.err("connect()", "MongoDB Version 3 to 6 is required");
		const client = await MongoClient.connect(uri).catch((error) => {
			throw new XpFatal({ function: "connect()", message: error.message });
		});

		xp.dbType = "mongodb";
		xp.database = client || undefined;
	}

		break;
	case "sqlite":
		try {
			const [ betterSqlite3, goodVersion ] = await Promise.all([
				import("better-sqlite3"), checkPackageVersion("better-sqlite3", 7, 9)
			]);

			if (!goodVersion) return XpLog.err("connect()", "better-sqlite3 Version 7 to 9 is required");

			xp.database = new betterSqlite3.default(uri);
			xp.dbType = "sqlite";

			xp.database.exec(`CREATE TABLE IF NOT EXISTS "simply-xps"
                              (
                                  user        TEXT    NOT NULL,
                                  guild       TEXT    NOT NULL,
                                  name        TEXT    NOT NULL DEFAULT user,
                                  level       INTEGER NOT NULL DEFAULT 0,
                                  xp          INTEGER NOT NULL DEFAULT 0,
                                  voice_xp    INTEGER          DEFAULT 0,
                                  voice_time  INTEGER          DEFAULT 0,
                                  lastUpdated DATE    NOT NULL,
                                  xp_rate     INTEGER          DEFAULT 0.1
                              )`
			);
			xp.database.exec(`CREATE TABLE IF NOT EXISTS "simply-xp-levelroles"
                              (
                                  gid         TEXT NOT NULL,
                                  lvlrole     TEXT NOT NULL,
                                  lastUpdated TEXT NOT NULL
                              )`
			);
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
	await db.findAll("simply-xps").then((users) => {
		(users as UserResult[]).filter((user) => user?.xp_rate !== xp.xp_rate).map((user) => {
			db.updateOne({
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

/**
 * Returns the package manager used
 * @private
 * @returns {Promise<"yarn" | "npm" | "pnpm">}
 */
async function getPackageManager(): Promise<"yarn" | "npm" | "pnpm"> {
	const { existsSync } = await import("fs");

	const lockfiles = [ "yarn.lock", "pnpm-lock.yaml", "pnpm-lock.json", "package-lock.json" ];
	const foundLockfiles = lockfiles.filter((lockfile) => existsSync(lockfile));

	if (foundLockfiles.length === 1) {
		if (foundLockfiles[0] === "yarn.lock") {
			XpLog.debug("getPackageManager()", "Using YARN");
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
 * @param {string} type - NPM Package Name (lowercase)
 * @param {number} min - Minimum Major Version Number
 * @param {number} max - Maximum Major Version Number (Optional)
 * @returns {Promise<boolean>}
 * @throws {XpFatal} If the package version is not supported
 */
export async function checkPackageVersion(type: string, min: number, max?: number): Promise<boolean> {
	try {
		const chosenPackage = await import(`${type}/package.json`);
		return parseInt(chosenPackage.version.substring(0, 1)) >= min && (max ? parseInt(chosenPackage.version.substring(0, 1)) <= max : true);
	} catch (_) {
		XpLog.info("checkPackageVersion()", `Installing ${type} [V${max || min}] | Please wait...`);
		execSync(`${await getPackageManager()} add ${type}@${max || min}.x.x`);
		XpLog.warn("checkPackageVersion()", `Installed ${type}. Please restart!`);
		return process.exit(1);
	}
}