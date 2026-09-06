import { XpFatal, XpLog } from "./functions/xplogs";
import { Database, xp } from "../xp";

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
	const userData = await Database.findOne({ collection: "simply-xps", data: userFilter });

	if (!userData) {
		if (xp.auto_create && !erase && username) {
			await Database.createOne({
				collection: "simply-xps",
				data: {
					guild: guildId,
					level: 0,
					name: username,
					user: userId,
					xp: 0,
					xp_rate: xp.xp_rate
				}
			}).catch((error) => {
				throw new XpFatal({ function: "reset()", message: error.stack });
			});
			return true;
		} else {
			return XpLog.info("reset()", "User was not found, we did not know what to do without a username.");
		}
	}

	if (erase) {
		await Database.deleteOne({ collection: "simply-xps", data: userFilter }).catch((error) => {
			throw new XpFatal({ function: "reset()", message: error });
		});
		return true;
	}

	const normalizedFlags = Array.isArray((userData as { flags?: Array<number | string> }).flags)
		? ((userData as { flags?: Array<number | string> }).flags || []).filter((flag) => flag !== "modified")
		: [];

	await Database.updateOne(
		{ collection: "simply-xps", data: userFilter },
		{
			collection: "simply-xps",
			data: {
				flags: normalizedFlags,
				guild: guildId,
				level: 0,
				name: username || (userData as { name?: string }).name || userId,
				user: userId,
				xp: 0,
				xp_rate: xp.xp_rate
			}
		}
	).catch((error) => {
		throw new XpFatal({ function: "reset()", message: error });
	});

	return true;
}