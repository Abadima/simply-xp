import {XpFatal} from "./functions/xplogs";
import {xp} from "../xp";

/**
 * Reset user levels to 0 in a guild
 * @async
 * @param {string} userId
 * @param {string} guildId
 * @param {string} username
 * @param {boolean?} erase - Erase user entry from database
 * @link `Documentation:` https://simplyxp.js.org/docs/reset
 * @returns {Promise<boolean>}
 * @throws {XpFatal} If an invalid type is provided or if the value is not provided.
 */
export async function reset(userId: string, guildId: string, username: string, erase: boolean = false): Promise<boolean> {
	if (!userId) throw new XpFatal({function: "reset()", message: "No User ID Provided"});
	if (!guildId) throw new XpFatal({function: "reset()", message: "No Guild ID Provided"});
	if (!username) throw new XpFatal({function: "reset()", message: "No Username Provided"});

	const {db} = await import("./functions/database");

	if (!await db.findOne({collection: "simply-xps", data: {guild: guildId, user: userId}})) {
		if (xp.auto_create && !erase) await db.createOne({
			collection: "simply-xps", data: {guild: guildId, user: userId, level: 0, xp: 0}
		}).then(() => {
			return true;
		}).catch((error) => {
			throw new XpFatal({function: "reset()", message: error.stack});
		});

		if (erase) return true;
	}

	if (erase) return await db.deleteOne({
		collection: "simply-xps",
		data: {guild: guildId, user: userId}
	}).catch((error) => {
		throw new XpFatal({function: "reset()", message: error});
	});

	return db.updateOne({
		collection: "simply-xps", data: {guild: guildId, user: userId}
	}, {
		collection: "simply-xps", data: {guild: guildId, user: userId, level: 0, xp: 0}
	}).catch((error) => {
		throw new XpFatal({function: "reset()", message: error});
	}) as unknown as boolean;
}