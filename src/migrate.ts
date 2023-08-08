import {XpFatal, XpLog} from "./functions/xplogs";
import {db} from "./functions/database";
import {xp} from "../xp";
import {MongoClient} from "mongodb";
import {Database} from "better-sqlite3";
import {checkPackageVersion} from "./connect";

/**
 * Migration functions
 * @class migrate
 */
export class migrate {

	/**
	 * Effortlessly migrate from discord-xp to simply-xp.
	 * @async
	 * @param {boolean} deleteOld - Delete old data after migration
	 * @link `Documentation:` https://simplyxp.js.org/docs/migrate/discord_xp
	 * @returns {Promise<boolean>} - Returns true if migration is successful
	 * @throws {XpLog.err} - If migration fails.
	 */
	static async discord_xp(deleteOld: boolean = false): Promise<boolean> {
		const results = await db.getCollection("levels").find().toArray();
		XpLog.debug("migrate.discord_xp()", `FOUND ${results.length} DOCUMENTS`);

		try {
			for (const user of results) {
				if (!await db.findOne({
					collection: "simply-xps", data: {guild: user.guildID, user: user.userID}
				})) {
					await db.createOne({
						collection: "simply-xps",
						data: {guild: user.guildID, user: user.userID, xp: user.xp, level: user.level}
					});
					if (deleteOld) await db.getCollection("levels").deleteOne({
						userID: user.userID, guildID: user.guildID
					});
				}
			}
			return true;
		} catch (error) {
			XpLog.err("migrate.discord_xp()", error as string);
			return false;
		}
	}

	/**
	 * Effortlessly migrate from MongoDB to SQLite. (or vice versa)
	 * @async
	 * @param {"mongodb"|"sqlite"} dbType
	 * @param {Database | MongoClient} connection
	 * @link `Documentation:` https://simplyxp.js.org/docs/migrate/database
	 * @returns {Promise<boolean>} - Returns true if migration is successful
	 * @throws {XpFatal} - If parameters are not provided correctly
	 */
	static async fromDB(dbType: "mongodb" | "sqlite", connection: Database | MongoClient): Promise<boolean> {
		if (!dbType) throw new XpFatal({function: "migrate.database()", message: "No database type provided"});
		if (!connection) throw new XpFatal({
			function: "migrate.database()", message: "No database connection provided"
		});

		if (xp.dbType === dbType) return XpLog.info("migrate.fromDB()", "Same database received, that was unnecessary!");

		switch (dbType) {
		case "mongodb":
			try {
				const goodVersion = await checkPackageVersion("mongodb");
				if (!goodVersion) return XpLog.err("migrate.fromDB()", "MongoDB V4 or higher is required");

				(connection as MongoClient).db().collection("simply-xps").find().toArray().then(async (results) => {
					XpLog.debug("migrate.fromDB()", `FOUND ${results.length} DOCUMENTS`);

					for (const user of results) {
						if (!await db.findOne({
							collection: "simply-xps", data: {guild: user.guild, user: user.user}
						})) {
							await db.createOne({
								collection: "simply-xps",
								data: {guild: user.guild, user: user.user, xp: user.xp, level: user.level}
							});
						} else {
							await db.updateOne({
								collection: "simply-xps",
								data: {guild: user.guild, user: user.user}
							}, {
								collection: "simply-xps",
								data: {guild: user.guild, user: user.user, name: user.name, xp: user.xp, level: user.level}
							});
						}
					}
					return true;
				});
			} catch (error) {
				XpLog.err("migrate.fromDB()", error as string);
			}
			return false;

		case "sqlite":
			// TODO: SQLite migration
			XpLog.warn("migrate.fromDB()", "SQLite migration is not yet supported, soon though!");
			return false;
		}
	}
}