import { ADAPTER_VERSION_RANGES, checkPackageVersion, ensureMongoSchemaVersion, ensureSqliteSchemaVersion, resolveXpRate, syncUsersXpRate } from "../connect";
import { clearAllCache, GlobalFonts } from "@napi-rs/canvas";
import { https, Plugin, xp } from "../../xp";
import { XpFatal, XpLog } from "./xplogs";
import { Database } from "better-sqlite3";
import { MongoClient } from "mongodb";

/**
 * Options for clean function.
 * @property {boolean} [db=false] - Whether to clean the database or not.
 * @link `Documentation:` https://simplyxp.js.org/docs/clean
 */
type CleanOptions = { db?: boolean };

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
	dbOptions?: { type: "mongodb", database: MongoClient, name?: string } | { type: "sqlite", database: Database };
	debug?: boolean;
	notify?: boolean;
	xp_rate?: "slow" | "normal" | "fast" | number;
}

/**
 * Helps to clean the database and cache, more in the future, maybe.
 * @param {CleanOptions} [options={}] - The options.
 * @param {boolean?} options.db - Whether to clean the database or not.
 * @link `Documentation:` https://simplyxp.js.org/docs/clean
 * @returns {void} - Nothing.
 * @throws {XpFatal} If an error occurs.
 */
export function clean(options: CleanOptions & { db: true }): Promise<void>;
export function clean(options?: CleanOptions): void;
export function clean(options: CleanOptions = {}): Promise<void> | void {
	clearAllCache();
	XpLog.debug("clean()", "CLEARED CANVAS CACHE");

	if (!options?.db || !xp?.database) return;

	return cleanZeroedUsers();
}

async function cleanZeroedUsers(): Promise<void> {
	try {
		switch (xp.dbType) {
			case "mongodb":
				await (xp.database as MongoClient)
					.db(xp.dbName)
					.collection("simply-xps")
					.deleteMany({ level: 0, xp: 0 });
				break;

			case "sqlite":
				(xp.database as Database)
					.prepare("DELETE FROM \"simply-xps\" WHERE level = 0 AND xp = 0")
					.run();
				break;
		}

		XpLog.debug("clean()", "REMOVED ALL USERS WITHOUT XP");
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		XpLog.warn("clean()", `Database cleanup failed: ${message}`);
	}
}

/**
 * Convert XP to level and vice versa.
 *
 * @param {number} value.
 * @param {"xp" | "level"} type - Type to convert from (Default: level).
 * @link `Documentation:` https://simplyxp.js.org/docs/Functions/convert
 * @returns {number} - The converted value. (XP to level or level to XP)
 * @throws {XpFatal} If an invalid type is provided or if the value is not provided.
 */
export function convertFrom(value: number, type: ("xp" | "level") = "level"): number {
	if (isNaN(value)) throw new XpFatal({ function: "convertFrom()", message: "Value was not provided" });
	if (type !== "xp" && type !== "level") throw new XpFatal({
		function: "convert()", message: "Invalid type provided"
	});
	if (!Number.isFinite(xp.xp_rate) || xp.xp_rate <= 0) throw new XpFatal({
		function: "convertFrom()", message: "xp_rate must be a finite number greater than 0"
	});

	if (type === "level") return Math.pow(Math.max(0, value) / xp.xp_rate, 2);
	return Math.floor(xp.xp_rate * Math.sqrt(Math.max(0, value)));
}

/**
 * Registers fonts from URLs or paths (For convenience).
 * @param {string} pathOrURL - The path or URL to the font.
 * @param {string} name - The name of the font.
 * @param {number} [timeout=1500] - The timeout for the request.
 * @link `Documentation:` https://simplyxp.js.org/docs/Functions/registerFont
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
 * @link `Documentation:` https://simplyxp.js.org/docs/Functions/registerPlugins
 * @returns {Promise<void>} - Resolves once all plugin initializers have completed.
 * @throws {XpFatal} If an invalid plugin is provided.
 */
const registeredPlugins = new Map<string, Plugin>();

export async function registerPlugins(plugins: Plugin[]): Promise<void> {
	if (!Array.isArray(plugins)) throw new XpFatal({
		function: "registerPlugins()", message: "Plugins must be an array"
	});

	const [rawVersionCore, xpPreRelease] = xp.version.split("-");
	const xpVersionCore = rawVersionCore ?? xp.version;
	const [xpMajor, xpMinor, xpPatch] = xpVersionCore.split(".").map((value) => parseInt(value, 10));

	await Promise.all(plugins.map(async (plugin): Promise<void> => {
		try {
			if (!plugin || typeof plugin !== "object") {
				XpLog.warn("registerPlugins()", "INVALID PLUGIN PROVIDED");
				return;
			}

			const pluginName = typeof plugin.name === "string" && plugin.name.trim().length > 0 ? plugin.name.trim() : undefined;
			if (!pluginName) {
				XpLog.warn("registerPlugins()", "INVALID PLUGIN PROVIDED");
				return;
			}

			if (typeof plugin.initialize !== "function") {
				XpLog.warn("registerPlugins()", `${pluginName.toUpperCase()} PLUGIN NOT INITIALIZED: No initialize function provided.`);
				return;
			}

			if ((plugin as { functions?: unknown }).functions !== undefined) {
				XpLog.warn("registerPlugins()", `${pluginName.toUpperCase()} PLUGIN: 'functions' is deprecated and ignored.`);
			}

			if (Array.isArray(plugin.requiredVersions) && plugin.requiredVersions.length > 0 && !plugin.requiredVersions.includes(xp.version)) {
				let invalidVersioning = false;
				const passedChecks = plugin.requiredVersions.some((version: string) => {
					const match = version.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([\w\d.-]+))?$/);
					if (!match) {
						invalidVersioning = true;
						return false;
					}

					if (parseInt(match[1] || "0", 10) !== xpMajor) return false;
					if (match[2] && parseInt(match[2], 10) !== xpMinor) return false;
					if (match[3] && parseInt(match[3], 10) !== xpPatch) return false;
					if (match[4] && match[4] !== xpPreRelease) return false;

					return true;
				});

				if (invalidVersioning) {
					XpLog.warn("registerPlugins()", `${pluginName.toUpperCase()} PLUGIN PROVIDED INVALID VERSION PATTERN(S) IN requiredVersions.`);
				}

				if (!passedChecks) {
					XpLog.warn("registerPlugins()", `${pluginName.toUpperCase()} PLUGIN NOT INITIALIZED: Requires: v${plugin.requiredVersions.join(", v")}`);
					return;
				}
			}

			await Promise.resolve(plugin.initialize(xp));
			registeredPlugins.set(pluginName, plugin);
			XpLog.info("registerPlugins()", `${pluginName.toUpperCase()} PLUGIN INITIALIZED`);
		} catch (error) {
			XpLog.err("registerPlugins()", `Failed to register plugin: ${plugin?.name || "unknown"}\n${error}`);
		}
	}));
}

/**
 * Unregister previously registered plugins, running each plugin's optional `destroy()`.
 *
 * Failures are isolated the same way registration is: one plugin throwing does not stop the rest.
 * @param {string[]} [names] - Plugin names to unregister. Omit to unregister all of them.
 * @link `Documentation:` https://simplyxp.js.org/docs/Functions/registerPlugins#unregisterplugins
 * @returns {Promise<void>} - Resolves once all matching plugins have been torn down.
 */
export async function unregisterPlugins(names?: string[]): Promise<void> {
	const targets = Array.isArray(names) && names.length > 0
		? names.map((name) => String(name).trim()).filter((name) => registeredPlugins.has(name))
		: [...registeredPlugins.keys()];

	await Promise.all(targets.map(async (name): Promise<void> => {
		const plugin = registeredPlugins.get(name);
		if (!plugin) return;

		try {
			if (typeof plugin.destroy === "function") await Promise.resolve(plugin.destroy(xp));
			XpLog.info("unregisterPlugins()", `${name.toUpperCase()} PLUGIN UNREGISTERED`);
		} catch (error) {
			XpLog.err("unregisterPlugins()", `Failed to unregister plugin: ${name}\n${error}`);
		} finally {
			registeredPlugins.delete(name);
		}
	}));
}


/**
 * Updates the options of the XP client.
 * @param {NewClientOptions} clientOptions - The new options to update.
 * @link `Documentation:` https://simplyxp.js.org/docs/Functions/updateOptions
 * @returns {void} - Nothing.
 * @throws {XpFatal} If an invalid option is provided.
 */
export async function updateOptions(clientOptions: NewClientOptions): Promise<void> {
	if (!clientOptions) throw new XpFatal({ function: "updateOptions()", message: "Options were not provided" });

	if (typeof clientOptions !== "object" || clientOptions === null) throw new XpFatal({
		function: "updateOptions()", message: "Options must be an object"
	});

	if (typeof clientOptions.auto_create === "boolean") xp.auto_create = clientOptions.auto_create;
	if (typeof clientOptions.debug === "boolean") xp.debug = clientOptions.debug;
	if (typeof clientOptions.notify === "boolean") xp.notify = clientOptions.notify;
	if (clientOptions.xp_rate !== undefined) xp.xp_rate = resolveXpRate("updateOptions()", clientOptions.xp_rate);

	if (clientOptions.dbOptions && typeof clientOptions.dbOptions === "object" && clientOptions.dbOptions.type && clientOptions.dbOptions.database) {
		const { type, database } = clientOptions.dbOptions;

		if ((type && type === "mongodb") || type === "sqlite") xp.dbType = type;
		else throw new XpFatal({ function: "updateOptions()", message: "Invalid database type provided" });

		if (database) {
			xp.database = database;
			if (type === "mongodb") xp.dbName = (clientOptions.dbOptions as { name?: string }).name;
			if (type === "mongodb" && !xp.dbName) throw new XpFatal({
				function: "updateOptions()", message: "MongoDB requires dbOptions.name so simply-xp knows which database to use"
			});
			const dbInfo = xp.dbType === "mongodb" ?
				{ name: "MONGODB", type: "mongodb", ...ADAPTER_VERSION_RANGES.mongodb } :
				{ name: "BETTER-SQLITE3", type: "better-sqlite3", ...ADAPTER_VERSION_RANGES["better-sqlite3"] };

			const result = await checkPackageVersion(dbInfo.type, dbInfo.min, dbInfo.max);
			switch (result) {
				case "too_low":
					throw new XpFatal({
						function: "updateOptions()", message: `${dbInfo.name} V${dbInfo.min} OR NEWER IS REQUIRED`
					});
				case "too_high":
					XpLog.warn("updateOptions()", `${dbInfo.name} VERSION IS NEWER THAN TESTED (V${dbInfo.max}) -- CONTINUE WITH CAUTION`);
					break;
				case "ok":
					XpLog.debug("updateOptions()", `${dbInfo.name} is natively compatible with our package! 🎉`);
					break;
			}

			switch (xp.dbType) {
				case "mongodb":
					try {
						await (xp.database as MongoClient).db(xp.dbName).command({ ping: 1 });
						await ensureMongoSchemaVersion(xp.database as MongoClient);
					} catch {
						xp.database = undefined;
						throw new XpFatal({ function: "updateOptions()", message: "Invalid MongoDB connection" });
					}
					break;

				case "sqlite":
					try {
						(xp.database as Database).prepare("SELECT 1").get();
						ensureSqliteSchemaVersion(xp.database as Database);
					} catch {
						throw new XpFatal({ function: "updateOptions()", message: "Invalid SQLite connection" });
					}
					break;
			}
		}
	}

	await clean({ db: true });
	await syncUsersXpRate("updateOptions()");
}
