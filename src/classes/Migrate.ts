import { requireSupportedAdapter } from "../functions/adapters";
import { requireValue } from "../functions/guards";
import { convertFrom } from "../functions/curve";
import { Database as SQLiteClient } from "better-sqlite3";
import { XpLog } from "../functions/xplogs";
import { Database, UserResult } from "./Database";
import { Document, MongoClient } from "mongodb";
import { sqlite } from "../functions/db";
import { xp } from "../client";

/**
 * Migration functions
 * @class Migrate
 * @link `Documentation:` https://simplyxp.js.org/docs/classes/Migrate
 */
export class Migrate {
	/**
	 * Effortlessly migrate from discord-xp to simply-xp.
	 * @async
	 * @param {boolean} deleteOld - Delete old data after migration
	 * @link `Documentation:` https://simplyxp.js.org/docs/classes/migrate#migratediscord_xp
	 * @returns {Promise<boolean>} - `true` if the migration succeeded; `false` (after logging the error) if it failed
	 */
	static async discord_xp(deleteOld: boolean = false): Promise<boolean> {
		try {
			const results = await Database.getCollection("levels").find().toArray();
			XpLog.debug("migrate.discord_xp()", `FOUND ${results.length} DOCUMENTS`);

			for (const user of results) {
				if (!await Database.findOne({
					collection: "simply-xps", data: { guild: user.guildID, user: user.userID }
				})) {
					await Database.createOne({
						collection: "simply-xps",
						data: { guild: user.guildID, user: user.userID, xp: user.xp, level: convertFrom(user.xp, "xp") }
					});
					if (deleteOld) await Database.getCollection("levels").deleteOne({
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
	 * @link `Documentation:` https://simplyxp.js.org/docs/classes/migrate#migratefromdb
	 * @returns {Promise<boolean>} - Returns true if migration is successful
	 * @throws {XpFatal} - If parameters are not provided correctly
	 */
	static async fromDB(dbType: "mongodb" | "sqlite", connection: SQLiteClient | MongoClient): Promise<boolean> {
		requireValue("migrate.fromDB()", dbType, "No database type provided");
		requireValue("migrate.fromDB()", connection, "No database connection provided");

		if (xp.dbType === dbType) return XpLog.info("migrate.fromDB()", "Same database received, that was unnecessary!");
		let results: UserResult[];

		switch (dbType) {
			case "mongodb":
				try {
					await requireSupportedAdapter("migrate.fromDB()", "mongodb");

					results = await (connection as MongoClient).db(xp.dbName).collection("simply-xps").find().toArray() as Document as UserResult[];

				} catch (error) {
					XpLog.err("migrate.fromDB()", error as string);
					return false;
				}
				break;

			case "sqlite":
				try {
					await requireSupportedAdapter("migrate.fromDB()", "sqlite");

					results = (connection as SQLiteClient).prepare("SELECT * FROM `simply-xps`").all() as UserResult[];

				} catch (error) {
					XpLog.err("migrate.fromDB()", error as string);
					return false;
				}
				break;
		}

		XpLog.debug("migrate.fromDB()", `FOUND ${results.length} RESULTS`);

		await Promise.all(results.map(async (user) => {
			if (!await Database.findOne({ collection: "simply-xps", data: { guild: user.guild, user: user.user } })) {
				return Database.createOne({
					collection: "simply-xps",
					data: { guild: user.guild, user: user.user, name: user.name, xp: user.xp, level: user.level }
				});
			} else {
				return Database.updateOne({
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
	 * @link `Documentation:` https://simplyxp.js.org/docs/classes/migrate#migraterolesetup
	 * @param {boolean} keepOld - Keep old data after migration
	 * @returns {Promise<boolean>} - `true` if the migration succeeded; `false` (after logging the error) if it failed
	 */
	static async roleSetup(keepOld: boolean = false): Promise<boolean> {
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
			const allDocs = await Database.findAll("simply-xp-levelroles") as LevelRoleDoc[];
			XpLog.debug("migrate.roleSetup()", `FOUND ${allDocs.length} DOCUMENTS`);

			if (xp.dbType === "sqlite") {
				const db = sqlite();
				const tableColumns = db.prepare("PRAGMA table_info(\"simply-xp-levelroles\")").all() as { name: string }[];
				const hasLegacyLvlroleColumn = tableColumns.some((column) => column.name === "lvlrole");

				const findByLevelStmt = db.prepare("SELECT 1 FROM \"simply-xp-levelroles\" WHERE guild = ? AND json_extract(levelrole, '$.level') = ? LIMIT 1");
				const insertStmt = db.prepare("INSERT INTO \"simply-xp-levelroles\" (guild, levelrole, createdAt, lastUpdated) VALUES (?, ?, ?, ?)");
				const deleteLegacyStmt = hasLegacyLvlroleColumn
					? db.prepare("DELETE FROM \"simply-xp-levelroles\" WHERE guild = ? AND lvlrole = ?")
					: null;

				const migrationTxn = db.transaction((docs: LevelRoleDoc[]) => {
					for (const doc of docs) {
						const legacyLvlrole = doc.lvlrole;
						if (!legacyLvlrole || doc.levelrole || !doc.guild) continue;

						const roles = Array.isArray(legacyLvlrole.role) ? legacyLvlrole.role : [legacyLvlrole.role];
						const level = legacyLvlrole.lvl;

						const existing = findByLevelStmt.get(doc.guild, level);
						if (!existing) {
							const now = new Date().toISOString();
							insertStmt.run(doc.guild, JSON.stringify({ level, roles }), now, now);
						}

						if (!keepOld && deleteLegacyStmt) {
							deleteLegacyStmt.run(doc.guild, JSON.stringify(legacyLvlrole));
						}
					}
				});

				migrationTxn(allDocs);
				return true;
			}

			for (const doc of allDocs) {
				const legacyLvlrole = doc.lvlrole;
				if (!legacyLvlrole) continue;
				if (doc.levelrole) continue;
				if (!doc.guild) continue;

				const roles = Array.isArray(legacyLvlrole.role) ? legacyLvlrole.role : [legacyLvlrole.role];
				const level = legacyLvlrole.lvl;

				await Database.updateOne({
					collection: "simply-xp-levelroles",
					data: { guild: doc.guild, levelrole: { level } }
				}, {
					collection: "simply-xp-levelroles",
					data: { guild: doc.guild, levelrole: { level, roles } }
				}, {
					upsert: true
				});

				if (!keepOld) {
					await Database.getCollection("simply-xp-levelroles").deleteOne({ guild: doc.guild, lvlrole: legacyLvlrole });
				}
			}

			return true;
		} catch (error) {
			return XpLog.err("migrate.roleSetup()", error as string);
		}
	}
}
