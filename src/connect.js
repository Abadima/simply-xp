const mongoose = require("mongoose");
const simplyxp = require("../simplyxp");

/**
 * @param {string} db
 * @param {import("../index").connectOptions} options
 */

async function connect(db, options = {}) {
	if (!db) throw new Error("[XP] Database URL was not provided");
	mongoose.set("strictQuery", true);

	mongoose.connect(db, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	});

	// Propagate auto_purge option to module options
	if (options.auto_purge !== undefined) {
		simplyxp.options.auto_purge = options.auto_purge;
	}

	if (options.notify) return console.log("{ XP } Database Connected");
}

module.exports = connect;