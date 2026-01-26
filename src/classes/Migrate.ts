import { Database as SQLiteClient } from "better-sqlite3";
import { XpFatal, XpLog } from "../functions/xplogs";
import { Database, UserResult } from "./Database";
import { checkPackageVersion } from "../connect";
import { Document, MongoClient } from "mongodb";
import { convertFrom, db, xp } from "../../xp";

/**
 * Migration functions
 * @class Migrate
 * @link `Documentation:` https://simplyxp.js.org/docs/next/classes/Migrate
 */
export class Migrate {
	/**
	 * Effortlessly migrate from discord-xp to simply-xp.
	 * @async
	 * @param {boolean} deleteOld - Delete old data after migration
	 * @link `Documentation:` https://simplyxp.js.org/docs/next/classes/migrate#migratediscord_xp
	 * @returns {Promise<boolean>} - Returns true if migration is successful
	 * @throws {XpLog.err} - If migration fails.
	 */
	static async discord_xp(deleteOld: boolean = false): Promise<boolean> {
		const results = await db.getCollection("levels").find().toArray();
		XpLog.debug("migrate.discord_xp()", `FOUND ${results.length} DOCUMENTS`);

		try {
			for (const user of results) {
				if (!await db.findOne({
					collection: "simply-xps", data: { guild: user.guildID, user: user.userID }
				})) {
					await db.createOne({
						collection: "simply-xps",
						data: { guild: user.guildID, user: user.userID, xp: user.xp, level: convertFrom(user.xp, "xp") }
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
	 * @param {SQLiteClient | MongoClient} connection
	 * @link `Documentation:` https://simplyxp.js.org/docs/next/classes/migrate#migratefromdb
	 * @returns {Promise<boolean>} - Returns true if migration is successful
	 * @throws {XpFatal} - If parameters are not provided correctly
	 */
	static async fromDB(dbType: "mongodb" | "sqlite", connection: SQLiteClient | MongoClient): Promise<boolean> {
		if (!dbType) throw new XpFatal({
			function: "migrate.database()", message: "No database type provided"
		});

		if (!connection) throw new XpFatal({
			function: "migrate.database()", message: "No database connection provided"
		});

		if (xp.dbType === dbType) return XpLog.info("migrate.fromDB()", "Same database received, that was unnecessary!");
		let results: UserResult[];

		switch (dbType) {
			case "mongodb":
				try {
					switch (await checkPackageVersion("mongodb", 3, 7)) {
						case "too_low":
							throw new XpFatal({ function: "migrate.fromDB()", message: "MongoDB V3 OR NEWER IS REQUIRED" });
						case "too_high":
							XpLog.warn("migrate.fromDB()", "MongoDB VERSION IS NEWER THAN TESTED (V7) -- CONTINUE WITH CAUTION");
							break;
						case "ok":
							XpLog.debug("migrate.fromDB()", "MongoDB is natively compatible with our package! 🎉");
					}

					results = await (connection as MongoClient).db().collection("simply-xps").find().toArray() as Document as UserResult[];

				} catch (error) {
					XpLog.err("migrate.fromDB()", error as string);
					return false;
				}
				break;

			case "sqlite":
				try {
					switch (await checkPackageVersion("better-sqlite3", 7, 12)) {
						case "too_low":
							throw new XpFatal({ function: "migrate.fromDB()", message: "BETTER-SQLITE3 V7 OR NEWER IS REQUIRED" });
						case "too_high":
							XpLog.warn("migrate.fromDB()", "BETTER-SQLITE3 VERSION IS NEWER THAN TESTED (V12) -- CONTINUE WITH CAUTION");
							break;
						case "ok":
							XpLog.debug("migrate.fromDB()", "better-sqlite3 is natively compatible with our package! 🎉");
					}

					results = (connection as SQLiteClient).prepare("SELECT * FROM `simply-xps`").all() as UserResult[];

				} catch (error) {
					XpLog.err("migrate.fromDB()", error as string);
					return false;
				}
				break;
		}

		XpLog.debug("migrate.fromDB()", `FOUND ${results.length} RESULTS`);

		await Promise.all(results.map(async (user) => {
			if (!await db.findOne({ collection: "simply-xps", data: { guild: user.guild, user: user.user } })) {
				return db.createOne({
					collection: "simply-xps",
					data: { guild: user.guild, user: user.user, xp: user.xp, level: user.level }
				});
			} else {
				return db.updateOne({
					collection: "simply-xps", data: { guild: user.guild, user: user.user }
				}, {
					collection: "simply-xps",
					data: { guild: user.guild, user: user.user, name: user.name, xp: user.xp, level: user.level }
				});
			}
		}));

		return true;
	}

	/**
	 * Effortlessly migrate from roleSetup's schema to LevelRoles schema.
	 * @async
	 * @link `Documentation:` https://simplyxp.js.org/docs/next/classes/migrate#migraterolesetup
	 * @param {boolean} keepOld - Keep old data after migration
	 * @returns {Promise<boolean>} - Returns true if migration is successful
	 * @throws {XpLog.err} - If migration fails.
	 */
	static async roleSetup(keepOld: boolean = false): Promise<boolean> {
		const allDocs = await Database.findAll("simply-xp-levelroles");

		XpLog.debug("migrate.roleSetup()", `FOUND ${allDocs.length} DOCUMENTS`);

		interface LevelRoleDoc {
			guild?: string;
			lvlrole?: {
				lvl: number;
				role: string | string[];
			};
			levelrole?: {
				level: number;
				roles: string[];
			};
			[key: string]: unknown;
		}

		try {
			for (const doc of allDocs as LevelRoleDoc[]) {
				const legacyLvlrole = doc.lvlrole;
				if (!legacyLvlrole) continue;
				if (doc.levelrole) continue;

				const roles = Array.isArray(legacyLvlrole.role) ? legacyLvlrole.role : [legacyLvlrole.role];

				if (!doc.guild) continue;

				await Database.createOne({
					collection: "simply-xp-levelroles",
					data: {
						guild: doc.guild,
						levelrole: {
							level: legacyLvlrole.lvl, roles: roles
						}
					}
				});

				if (!keepOld) {
					switch (xp.dbType) {
						case "mongodb":
							await (Database.getCollection("simply-xp-levelroles").deleteOne({ guild: doc.guild, lvlrole: legacyLvlrole }));
							break;
						case "sqlite":
							(xp.database as SQLiteClient).prepare("DELETE FROM `simply-xp-levelroles` WHERE gid = ? AND lvlrole = ?")
								.run(doc.guild, JSON.stringify(legacyLvlrole));
							break;
					}

				}
			}

			if (xp.dbType === "sqlite" && !keepOld) {
				(xp.database as SQLiteClient).exec(`
					CREATE TABLE "simply-xp-levelroles_tmp" AS SELECT gid, levelrole, createdAt, lastUpdated FROM "simply-xp-levelroles";
					DROP TABLE "simply-xp-levelroles";
					ALTER TABLE "simply-xp-levelroles_tmp" RENAME TO "simply-xp-levelroles";
				`);
			}

			return true;
		} catch (error) {
			return XpLog.err("migrate.roleSetup()", error as string);
		}
	}
}

/**
 * Exports the `Migrate` class as `migrate`.
 * @deprecated Use `Migrate` class instead, this will be removed in the near future.
 */
export const migrate = Migrate;