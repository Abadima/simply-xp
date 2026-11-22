const database = require("./core/database");
const options = require("./core/options");
const store = require("./core/store");

/**
 * @param {string} db
 * @param {import("../index").connectOptions} connectOptions
 */
async function connect(db, connectOptions = {}) {
	if (!db) throw new Error("[XP] Database URL was not provided");

	if (connectOptions.auto_purge !== undefined) {
		options.auto_purge = connectOptions.auto_purge;
	}

	await database.connect(db);
	await store.setup();

	if (connectOptions.notify) console.log("{ XP } Database Connected");
}

module.exports = connect;
