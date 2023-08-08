import {XpFatal} from "./xplogs";
import {xp} from "../../xp";
import {MongoClient} from "mongodb";
import {Database} from "better-sqlite3";
import {checkPackageVersion} from "../connect";

/**
 * Options for the XP client.
 * @property {boolean} auto_create - Whether to automatically create a user if they don't exist in the database.
 * @property {boolean} auto_purge - Whether to automatically purge inactive users.
 * @property {object} dbOptions - The database options.
 * @property {"mongodb" | "sqlite"} dbOptions.type
 * @property {MongoClient | Database} dbOptions.database
 * @property {boolean} notify - Enable/Disable console notifications.
 * @property {boolean} debug - Whether to enable debug logs.
 */
interface NewClientOptions {
	auto_create: boolean;
	auto_purge: boolean;
	dbOptions: { type: "mongodb" | "sqlite"; database: MongoClient | Database; };
	notify: boolean;
	debug: boolean;
}

/**
 * Convert XP to level and vice versa.
 *
 * @param {number} value.
 * @param {"xp" | "level"} type - Type to convert from (Default: level).
 * @link `Documentation:` https://simplyxp.js.org/docs/utilities/convert
 * @returns {number} - The converted value. (XP to level or level to XP)
 * @throws {XpFatal} If an invalid type is provided or if the value is not provided.
 */
export function convertFrom(value: number, type: "xp" | "level" = "level"): number {
	if (isNaN(value)) throw new XpFatal({function: "convertFrom()", message: "Value was not provided"});
	if (type !== "xp" && type !== "level") throw new XpFatal({
		function: "convert()", message: "Invalid type provided"
	});

	if (type === "level") return Math.pow(value / 0.1, 2);
	if (type === "xp") return Math.floor(0.1 * Math.sqrt(value));

	throw new XpFatal({function: "convertFrom()", message: "Invalid type provided"});
}


/**
 * Updates the options of the XP client.
 * @param {NewClientOptions} clientOptions - The new options to update.
 * @link `Documentation:` https://simplyxp.js.org/docs/utilities/updateOptions
 * @returns {void} - Nothing.
 * @throws {XpFatal} If an invalid option is provided.
 */
export function updateOptions(clientOptions: NewClientOptions): void {
	if (!clientOptions) throw new XpFatal({function: "updateOptions()", message: "Options were not provided"});

	if (typeof clientOptions !== "object") throw new XpFatal({
		function: "updateOptions()", message: "Options must be an object"
	});

	xp.auto_create = clientOptions.auto_create;
	xp.auto_purge = clientOptions.auto_purge;
	xp.notify = clientOptions.notify;
	xp.debug = clientOptions.debug;

	if (clientOptions.dbOptions && typeof clientOptions.dbOptions === "object" && clientOptions.dbOptions.type && clientOptions.dbOptions.database) {
		const {type, database} = clientOptions.dbOptions;

		if (type && type === "mongodb" || type === "sqlite") xp.dbType = type;
		else throw new XpFatal({function: "updateOptions()", message: "Invalid database type provided"});

		if (database) {
			xp.database = database;

			if (xp.dbType === "mongodb") {
				checkPackageVersion("mongodb").then((result) => {
					if (!result) throw new XpFatal({
						function: "updateOptions()", message: "MongoDB V4 or higher is required"
					});

					(xp.database as MongoClient).db().command({ping: 1}).catch(() => {
						xp.database = undefined;
						throw new XpFatal({function: "updateOptions()", message: "Invalid MongoDB connection"});
					});
				});

			} else if (xp.dbType === "sqlite") {
				checkPackageVersion("sqlite").then((result) => {
					if (!result) throw new XpFatal({
						function: "updateOptions()", message: "SQLite V7 or higher is required"
					});

					try {
						(xp.database as Database).prepare("SELECT 1").get();
					} catch (error) {
						throw new XpFatal({function: "updateOptions()", message: "Invalid SQLite connection"});
					}
				});
			}
		}
	}
}