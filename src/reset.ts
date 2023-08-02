import {XpFatal} from "./functions/xplogs";

/**
 * Reset user levels to 0 in a guild
 * @async
 * @param {string} userId
 * @param {string} guildId
 * @param {boolean} erase - Erase user entry from database
 * @link `Documentation:` https://simplyxp.js.org/docs/reset
 * @returns {Promise<boolean>}
 * @throws {XpFatal} If an invalid type is provided or if the value is not provided.
 */
export async function reset(userId: string, guildId: string, erase: boolean): Promise<boolean> {
	if (!userId) throw new XpFatal({function: "reset()", message: "No User ID Provided"});
	if (!guildId) throw new XpFatal({function: "reset()", message: "No Guild ID Provided"});

	const {db} = await import("./functions/database");

	if (erase) return await db.deleteOne({collection: "simply-xps", data: {guild: guildId, user: userId}}).catch((error) => {
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