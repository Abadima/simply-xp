import {XpFatal, XpLog} from "./functions/xplogs";
import {db} from "./functions/database";

/**
 * Migration functions
 * @class migrate
 */
export class migrate {

	/**
	 * Effortlessly migrate from discord-xp to simply-xp.
	 * @async
	 * @param {URL} dbUrl - MongoDB URL
	 * @param {boolean} deleteOld - Delete old data after migration
	 * @link `Documentation:` https://simplyxp.js.org/docs/migrate/discord_xp
	 * @returns {Promise<boolean>} - Returns true if migration is successful
	 * @throws {XpFatal} - If parameters are not provided correctly
	 */
	static async discord_xp(dbUrl: URL, deleteOld: boolean): Promise<boolean> {
		try {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			await import("discord-xp").setURL(dbUrl);
			const pkg = await import("discord.js/package.json");
			XpLog.debug("migrate.discord_xp()", `Discord.JS v${pkg.version} detected.`);

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			const discordDB = await import("discord-xp/models/levels");

			await discordDB.find({}).then(async (data: any) => {
				for (const user of data) {
					if (!await db.findOne({
						collection: "simply-xps", data: {guild: user.guildID, user: user.userID}
					})) {
						await db.createOne({collection: "simply-xps", data: {guild: user.guildID, user: user.userID, xp: user.xp, level: user.level}});
						if (deleteOld) await discordDB.deleteOne({userID: user.userID, guildID: user.guildID});
					}
				}
			});
			return true;
		} catch (error) {
			throw new XpFatal({
				function: "migrate.discord_xp()", message: "Unfortunately this function requires discord-xp to be installed, you can uninstall it after using this function!"
			});
		}
	}

	/**
	 * Effortlessly migrate from MongoDB to SQLite. (or vice versa)
	 * @async
	 * @param {"mongodb"|"sqlite"} from
	 * @link `Documentation:` https://simplyxp.js.org/docs/migrate/database
	 * @returns {Promise<boolean>} - Returns true if migration is successful
	 * @throws {XpFatal} - If parameters are not provided correctly
	 */
	static async database(from: "mongodb" | "sqlite") {
		if (!from) throw new XpFatal({function: "migrate.database()", message: "No database type provided"});

		throw new XpFatal({function: "migrate.database()", message: "This function is not yet implemented, please wait for the next dev release!"});
	}
}