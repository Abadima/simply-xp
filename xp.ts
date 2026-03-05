// IMPORTS
import { Database } from "better-sqlite3";
import { MongoClient } from "mongodb";

// INTERFACES

/**
 * XP Plugin
 * @property {string} name - The name of the plugin.
 * @property {Record<string, (arg: number | object | string) => Promise<Array<unknown> | boolean | number | object | string | void>>} functions - The functions to add to the XP client.
 * @property {Function} initialize - The function to run when the plugin is initialized.
 * @property {Array<`${number}` | `${number}.${number}` | `${number}.${number}.${number}` | `${number}.${number}.${number}-${string}.${number}`>} requiredVersions - Compatible SimplyXP Versions.
 * @returns {Promise<boolean | Error>} - Returns true if the plugin was initialized successfully, otherwise returns an error.
 */
export interface Plugin {
	name: string;
	functions?: Record<string, (arg: number | object | string) => Promise<Array<unknown> | boolean | number | object | string | void>>;
	initialize: (client: XPClient) => Promise<void>;
	requiredVersions?: Array<`${number}` | `${number}.${number}` | `${number}.${number}.${number}` | `${number}.${number}.${number}-${string}.${number}`>;
}

/**
 * User object
 * @property {string} guild - Guild ID
 * @property {string} user - User ID
 * @property {string} name - Username
 * @property {number} position - Position in leaderboard
 * @property {number} level - User level
 * @property {number} xp - User XP
 */
export interface User {
	flags?: Array<number | string> | undefined;
	guild: string;
	user: string;
	name?: string | null;
	lastUpdated?: string;
	level: number;
	position: number;
	xp: number;
}

/**
 * Runtime configuration and metadata surface exposed through `xp`.
 * @property {boolean} auto_clean - Automatically clean caches or databases after major operations.
 * @property {boolean} auto_create - Allow functions to create missing users when queried.
 * @property {MongoClient | Database | undefined} database - Underlying database connection reference.
 * @property {string} [dbName] - MongoDB only: explicit database name. When set, used instead of the default derived from the connection URI.
 * @property {"mongodb" | "sqlite"} dbType - The configured database provider.
 * @property {boolean} debug - Emit debug logging via `XpLog.debug`.
 * @property {boolean} notify - Enable console notifications (on by default).
 * @property {string[]} registeredFonts - Fonts already registered for rendering helpers.
 * @property {`${number}.${number}.${number}` | `${number}.${number}.${number}-${string}.${number}`} version - The simply-xp version string baked into the package.
 * @property {number} xp_rate - Global XP rate used in XP ↔︎ level conversions.
 */
export interface XPClient {
	auto_clean: boolean;
	auto_create: boolean;
	database: MongoClient | Database | undefined;
	dbName?: string;
	dbType: "mongodb" | "sqlite";
	debug: boolean;
	notify: boolean;
	registeredFonts: string[];
	version: `${number}.${number}.${number}` | `${number}.${number}.${number}-${string}.${number}`;
	xp_rate: number;
}


// FUNCTION/CLASS EXPORTS

export { addLevel, addXP } from "./src/add";

export { Database, db } from "./src/classes/Database";

export { charts } from "./src/charts";

export { compareCard, leaderboardCard, rankCard } from "./src/cards";

export { connect } from "./src/connect";

export { clean, convertFrom, registerFont, registerPlugins, updateOptions } from "./src/functions/utilities";

export { create } from "./src/create";

export { fetch } from "./src/fetch";

export { https } from "./src/functions/https";

export { leaderboard } from "./src/leaderboard";

export { LevelRoles } from "./src/classes/LevelRoles";

export { Migrate, migrate } from "./src/classes/Migrate";

export { removeLevel, removeXP } from "./src/remove";

export { reset } from "./src/reset";

export { setFlags } from "./src/setFlags";

export { setLevel, setXP } from "./src/set";

export { XpEvents } from "./src/functions/xplogs";

export const xp: XPClient = {
	auto_clean: false,
	auto_create: false,
	database: undefined,
	dbType: "mongodb",
	debug: false,
	notify: true,
	registeredFonts: [],
	version: "2.0.0-beta.4",
	xp_rate: 0.1
};