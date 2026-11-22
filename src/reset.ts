import { XpFatal, XpLog } from "./functions/xplogs";
import { canAutoCreate } from "./functions/guards";
import { findUser } from "./functions/users";
import { Database } from "./classes/Database";
import { xp } from "./client";

const failed = (error: Error): never => {
	throw new XpFatal({ function: "reset()", message: error });
};

/**
 * Reset user levels to 0 in a guild
 * @async
 * @param {string} userId
 * @param {string} guildId
 * @param {boolean?} erase - Erase user entry from the database
 * @param {string?} username - Username to use if auto_create is enabled
 * @link `Documentation:` https://simplyxp.js.org/docs/functions/reset
 * @returns {Promise<boolean>}
 * @throws {XpFatal} If an invalid type is provided or if the value is not provided.
 */
export async function reset(userId: string, guildId: string, erase: boolean = false, username?: string): Promise<boolean> {
	if (!userId || !guildId) {
		throw new XpFatal({ function: "reset()", message: "Invalid parameters provided" });
	}

	const userFilter = { guild: guildId, user: userId };
	const userData = await findUser(guildId, userId);

	if (!userData) {
		if (erase || !canAutoCreate(username)) {
			return XpLog.info("reset()", "User was not found, we did not know what to do without a username.");
		}

		await Database.createOne({
			collection: "simply-xps",
			data: { guild: guildId, level: 0, name: username, user: userId, xp: 0, xp_rate: xp.xp_rate }
		}).catch(failed);
		return true;
	}

	if (erase) {
		await Database.deleteOne({ collection: "simply-xps", data: userFilter }).catch(failed);
		return true;
	}

	await Database.updateOne(
		{ collection: "simply-xps", data: userFilter },
		{
			collection: "simply-xps",
			data: { guild: guildId, level: 0, name: username || userData.name || userId, user: userId, xp: 0, xp_rate: xp.xp_rate }
		}
	).catch(failed);

	return true;
}
