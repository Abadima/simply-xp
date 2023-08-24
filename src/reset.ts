import {XpFatal, XpLog} from "./functions/xplogs";
import {xp} from "../xp";
import {db} from "./functions/database";

/**
 * Reset user levels to 0 in a guild
 * @async
 * @param {string} userId
 * @param {string} guildId
 * @param {boolean?} erase - Erase user entry from the database
 * @param {string?} username - Username to use if auto_create is enabled
 * @link `Documentation:` https://simplyxp.js.org/docs/reset
 * @returns {Promise<boolean>}
 * @throws {XpFatal} If an invalid type is provided or if the value is not provided.
 */
export async function reset(userId: string, guildId: string, erase: boolean = false, username?: string): Promise<boolean> {
	if (!userId || !guildId) {
		throw new XpFatal({function: "reset()", message: "Invalid parameters provided"});
	}

	const userData = {guild: guildId, user: userId};

	if (!await db.findOne({collection: "simply-xps", data: userData})) {
		if (xp.auto_create && !erase && username) {
			await db.createOne({collection: "simply-xps", data: userData}).catch((error) => {
				throw new XpFatal({function: "reset()", message: error.stack});
			});
			return true;
		} else {
			return XpLog.info("reset()", "User was not found, we did not know what to do without a username.");
		}
	}

	if (erase) {
		await db.deleteOne({collection: "simply-xps", data: userData}).catch((error) => {
			throw new XpFatal({function: "reset()", message: error});
		});
		return true;
	}

	await db.updateOne(
		{collection: "simply-xps", data: {user: userId, guild: guildId}},
		{collection: "simply-xps", data: {...userData, level: 0, xp: 0}}
	).catch((error) => {
		throw new XpFatal({function: "reset()", message: error});
	});

	return true;
}