import { checkPackageVersion } from "../connect";
import { clearAllCache, GlobalFonts } from "@napi-rs/canvas";
import { Database } from "better-sqlite3";
import { db, https, Plugin, xp } from "../../xp";
import { MongoClient } from "mongodb";
import { UserResult } from "./database";
import { XpFatal, XpLog } from "./xplogs";

/**
 * Options for clean function.
 * @property {boolean} [db=false] - Whether to clean the database or not.
 * @link `Documentation:` https://simplyxp.js.org/docs/next/clean
 */
type CleanOptions = { db?: boolean };

/**
 * Options for the XP client.
 * @property {boolean} auto_create - Whether to automatically create a user if they don't exist in the database.
 * @property {boolean} auto_clean - Whether to automatically clean database and cache.
 * @property {object} dbOptions - The database options.
 * @property {"mongodb" | "sqlite"} dbOptions.type - The database type.
 * @property {MongoClient | Database} dbOptions.database - The database connection.
 * @property {boolean} debug - Whether to enable debug logs.
 * @property {boolean} notify - Enable/Disable console notifications.
 * @property {"slow" | "normal" | "fast" | number} xp_rate - The XP rate.
 */
interface NewClientOptions {
	auto_create: boolean;
	auto_clean: boolean;
	dbOptions: { type: "mongodb" | "sqlite"; database: MongoClient | Database; };
	debug: boolean;
	notify: boolean;
	xp_rate?: "slow" | "normal" | "fast" | number;
}

/**
 * Helps to clean the database and cache, more in the future, maybe.
 * @param {CleanOptions} [options={}] - The options.
 * @param {boolean?} options.db - Whether to clean the database or not.
 * @link `Documentation:` https://simplyxp.js.org/docs/next/clean
 * @returns {void} - Nothing.
 * @throws {XpFatal} If an error occurs.
 */
export function clean(options: CleanOptions = {}): void {
	if (options?.db && xp?.database) db.findAll("simply-xps").then((users) => {
		(users as UserResult[]).forEach(async (user) => {
			if (user.level === 0 && user.xp === 0) {
				await db.deleteOne({ collection: "simply-xps", data: { user: user.user, guild: user.guild } });
			}
		});
		XpLog.debug("clean()", "REMOVED ALL USERS WITHOUT XP");
	});

	clearAllCache();
	XpLog.debug("clean()", "CLEARED CANVAS CACHE");
}

/**
 * Convert XP to level and vice versa.
 *
 * @param {number} value.
 * @param {"xp" | "level"} type - Type to convert from (Default: level).
 * @link `Documentation:` https://simplyxp.js.org/docs/next/Functions/convert
 * @returns {number} - The converted value. (XP to level or level to XP)
 * @throws {XpFatal} If an invalid type is provided or if the value is not provided.
 */
export function convertFrom(value: number, type: ("xp" | "level") = "level"): number {
	if (isNaN(value)) throw new XpFatal({ function: "convertFrom()", message: "Value was not provided" });
	if (type !== "xp" && type !== "level") throw new XpFatal({
		function: "convert()", message: "Invalid type provided"
	});

	if (type === "level") return Math.pow(Math.max(0, value) / xp.xp_rate, 2);
	if (type === "xp") return Math.floor(xp.xp_rate * Math.sqrt(Math.max(0, value)));

	throw new XpFatal({ function: "convertFrom()", message: "Invalid type provided" });
}

/**
 * Registers fonts from URLs or paths (For convenience).
 * @param {string} pathOrURL - The path or URL to the font.
 * @param {string} name - The name of the font.
 * @param {number} [timeout=1500] - The timeout for the request.
 * @link `Documentation:` https://simplyxp.js.org/docs/next/Functions/registerFont
 * @returns {Promise<void>} - Nothing.
 * @throws {XpFatal} If an invalid path or URL is provided.
 */
export async function registerFont(pathOrURL: string, name: string, timeout: number = 1500): Promise<void> {
	if (xp.registeredFonts.includes(name)) return;

	if (pathOrURL.startsWith("https://")) {
		await https(pathOrURL, {
			responseType: "stream", timeout: timeout
		}).then((font): void => {
			GlobalFonts.register(font as Buffer, name);
			xp.registeredFonts.push(name);
		}).catch((error): void => {
			throw new XpFatal({
				function: "registerFont()", message: `Failed to register font from URL\n${JSON.stringify(error)}`
			});
		});
	} else {
		GlobalFonts.registerFromPath(pathOrURL, name);
		xp.registeredFonts.push(name);
	}
}

/**
 * Register Simply-XP Plugins.
 * @param {Plugin[]} plugins - The plugins to register.
 * @link `Documentation:` https://simplyxp.js.org/docs/next/Functions/registerPlugins
 * @returns {void} - Nothing.
 * @throws {XpFatal} If an invalid plugin is provided.
 */
export function registerPlugins(plugins: Plugin[]): void {
	if (!Array.isArray(plugins)) throw new XpFatal({
		function: "registerPlugins()", message: "Plugins must be an array"
	});

	plugins.forEach(async (plugin: Plugin) => {
		let invalidVersioning: boolean = false,
			passedChecks: boolean = true;

		if (!plugin?.initialize || !plugin?.name) {
			passedChecks = false;
			XpLog.warn("registerPlugins()", plugin?.name ? `${plugin.name.toUpperCase()} PLUGIN NOT INITIALIZED: No initialize function provided.` : "INVALID PLUGIN PROVIDED");
		}

		if (Array.isArray(plugin?.requiredVersions) && !plugin.requiredVersions.includes(xp.version)) {
			plugin.requiredVersions.forEach((version: string) => {
				if (parseInt(version)) {
					passedChecks = !!(parseInt(version) && version.length === 1 && xp.version.split(".")[0] === version);
				} else {
					if (!version.match(/\d\.\d\.\d/) && !passedChecks) {
						invalidVersioning = true;
						passedChecks = true;
					}
				}
			});

			if (invalidVersioning) XpLog.warn("registerPlugins()", `${plugin.name.toUpperCase()} PLUGIN FAILED VERSION CHECKS, ANYWAYS...`);
			if (!passedChecks && !invalidVersioning) XpLog.warn("registerPlugins()", `${plugin.name.toUpperCase()} PLUGIN NOT INITIALIZED: Requires: v${plugin.requiredVersions.join(", v")}`);
		}

		if (passedChecks) {
			try {
				await plugin.initialize(xp).then((): void => {
					XpLog.info("registerPlugins()", `${plugin.name.toUpperCase()} PLUGIN INITIALIZED`);
				});
			} catch (error) {
				throw new XpFatal({
					function: "registerPlugins()",
					message: `Failed to initialize plugin: ${plugin.name}\n${error}`
				});
			}
		}
	});
}


/**
 * Updates the options of the XP client.
 * @param {NewClientOptions} clientOptions - The new options to update.
 * @link `Documentation:` https://simplyxp.js.org/docs/next/Functions/updateOptions
 * @returns {void} - Nothing.
 * @throws {XpFatal} If an invalid option is provided.
 */
export function updateOptions(clientOptions: NewClientOptions): void {
	if (!clientOptions) throw new XpFatal({ function: "updateOptions()", message: "Options were not provided" });

	if (typeof clientOptions !== "object") throw new XpFatal({
		function: "updateOptions()", message: "Options must be an object"
	});

	if (clientOptions?.auto_clean) xp.auto_clean = true;
	if (clientOptions?.auto_create) xp.auto_create = true;
	if (clientOptions?.debug) xp.debug = true;
	if (clientOptions?.notify) xp.notify = clientOptions.notify;
	if (clientOptions?.xp_rate && (typeof clientOptions.xp_rate === "number" || ["fast", "normal", "slow"].includes(clientOptions.xp_rate))) xp.xp_rate = (clientOptions.xp_rate === "slow" ? 0.05 : clientOptions.xp_rate === "normal" ? 0.1 : clientOptions.xp_rate === "fast" ? 0.5 : clientOptions.xp_rate);

	if (clientOptions.dbOptions && typeof clientOptions.dbOptions === "object" && clientOptions.dbOptions.type && clientOptions.dbOptions.database) {
		const { type, database } = clientOptions.dbOptions;

		if (type && type === "mongodb" || type === "sqlite") xp.dbType = type;
		else throw new XpFatal({ function: "updateOptions()", message: "Invalid database type provided" });

		if (database) {
			xp.database = database;
			const dbInfo = xp.dbType === "mongodb" ?
				{ name: "MongoDB", type: "mongodb", min: 3, max: 6 } :
				{ name: "Better-SQLite3", type: "better-sqlite3", min: 7, max: 9 };

			checkPackageVersion(dbInfo.type, dbInfo.min, dbInfo.max).then((result) => {
				if (!result) throw new XpFatal({
					function: "updateOptions()",
					message: `${dbInfo.name} V${dbInfo.min} up to V${dbInfo.max} is required.`
				});

				switch (xp.dbType) {
				case "mongodb":
					(xp.database as MongoClient).db().command({ ping: 1 }).catch(() => {
						xp.database = undefined;
						throw new XpFatal({ function: "updateOptions()", message: "Invalid MongoDB connection" });
					});
					break;

				case "sqlite":
					try {
						(xp.database as Database).prepare("SELECT 1").get();
					} catch (error) {
						throw new XpFatal({ function: "updateOptions()", message: "Invalid SQLite connection" });
					}
					break;
				}
			});
		}
	}

	if (clientOptions?.auto_clean) clean({ db: true });

	// Update all users with the new XP rate
	db.findAll("simply-xps").then((users) => {
		(users as UserResult[]).filter((user) => user?.xp_rate !== xp.xp_rate).map(async (user) => {
			await db.updateOne({
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

		XpLog.debug("updateOptions()", "UPDATED ALL USERS WITH NEW XP RATE");
	});
}