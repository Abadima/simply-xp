// IMPORTS
import {Database} from "better-sqlite3";
import {MongoClient} from "mongodb";

// INTERFACES

export interface XPClient {
	dbType: "mongodb" | "sqlite";
	database: MongoClient | Database | undefined; // TODO: Remove undefined from database property
	auto_create: boolean;
	auto_purge: boolean;
	notify: boolean;
	debug: boolean;
}


// EXPORTS

export {addLevel, addXP} from "./src/add";

export {db} from "./src/functions/database";

export {charts} from "./src/charts";

export {connect} from "./src/connect";

export {convert, updateOptions} from "./src/functions/utilities";

export {create} from "./src/create";

export {fetch} from "./src/fetch";

export {leaderboard} from "./src/leaderboard";

export {migrate} from "./src/migrate";

export {rankCard, leaderboardCard} from "./src/cards";

export {reset} from "./src/reset";

export {roleSetup} from "./src/roleSetup";

export {setLevel, setXP} from "./src/set";

export const xp: XPClient = {
	auto_create: false,
	auto_purge: false,
	database: undefined,
	debug: false,
	dbType: "mongodb",
	notify: true
};

// DEPRECATED

export {rank} from "./src/deprecated/rank";