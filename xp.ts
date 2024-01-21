// IMPORTS
import { Database } from "better-sqlite3";
import { MongoClient } from "mongodb";

// INTERFACES

/**
 * XP Plugin
 * @property {string} name - The name of the plugin.
 * @property {Record<string, (arg: number | object | string) => Promise<Array<unknown> | boolean | number | object | string | void>>} functions - The functions to add to the XP client.
 * @property {Function} initialize - The function to run when the plugin is initialized.
 * @property {Array<string>} requiredVersions - Compatible SimplyXP Versions.
 * @returns {Promise<boolean | Error>} - Returns true if the plugin was initialized successfully, otherwise returns an error.
 */
export interface Plugin {
	name: string;
	functions?: Record<string, (arg: number | object | string) => Promise<Array<unknown> | boolean | number | object | string | void>>;
	initialize: (client: XPClient) => Promise<void>;
	requiredVersions?: Array<string>;
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
	guild: string;
	user: string;
	name?: string | null;
	position: number;
	lastUpdated?: string;
	level: number;
	xp: number;
}

export interface XPClient {
	auto_clean: boolean;
	auto_create: boolean;
	database: MongoClient | Database | undefined;
	dbType: "mongodb" | "sqlite";
	debug: boolean;
	notify: boolean;
	registeredFonts: string[];
	version: string;
	xp_rate: number;
}


// FUNCTION/CLASS EXPORTS

export { addLevel, addXP } from "./src/add";

export { db } from "./src/functions/database";

export { charts } from "./src/charts";

export { compareCard, leaderboardCard, rankCard } from "./src/cards";

export { connect } from "./src/connect";

export { clean, convertFrom, registerFont, registerPlugins, updateOptions } from "./src/functions/utilities";

export { create } from "./src/create";

export { fetch } from "./src/fetch";

export { https } from "./src/functions/https";

export { leaderboard } from "./src/leaderboard";

export { migrate } from "./src/migrate";

export { removeLevel, removeXP } from "./src/remove";

export { reset } from "./src/reset";

export { roleSetup } from "./src/roleSetup";

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
	version: "2.0.0-beta.0-fix.0",
	xp_rate: 0.1
};