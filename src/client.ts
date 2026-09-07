import { Database } from "better-sqlite3";
import { MongoClient } from "mongodb";

/**
 * XP Plugin
 * @property {string} name - The name of the plugin.
 * @property {Function} initialize - The function to run when the plugin is initialized.
 * @property {Function} [destroy] - Optional cleanup, run by `unregisterPlugins()`. Use it to clear timers, close handles or remove event listeners.
 * @property {Array<`${number}` | `${number}.${number}` | `${number}.${number}.${number}` | `${number}.${number}.${number}-${string}.${number}`>} requiredVersions - Compatible SimplyXP Versions.
 */
export interface Plugin {
	name: string;
	initialize: (client: XPClient) => void | Promise<void>;
	destroy?: (client: XPClient) => void | Promise<void>;
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
	flags: Array<number | string>;
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

export const xp: XPClient = {
	auto_create: false,
	database: undefined,
	dbType: "mongodb",
	debug: false,
	notify: true,
	registeredFonts: [],
	version: "2.0.1",
	xp_rate: 0.1
};
