import {XpFatal} from "./functions/xplogs";
import {UserResult} from "./functions/database";

/**
 * Create a new user in the database
 * @async
 * @param {string} userId
 * @param {string} guildId
 * @param {string} username
 * @link `Documentation:` https://simplyxp.js.org/docs/create
 * @returns {Promise<UserResult>}
 * @throws {XpFatal} If invalid parameters are provided
 */
export async function create(userId: string, guildId: string, username: string): Promise<UserResult> {
	if (!userId) throw new XpFatal({function: "create()", message: "User ID was not provided"});
	if (!guildId) throw new XpFatal({function: "create()", message: "Guild ID was not provided"});
	if (!username) throw new XpFatal({function: "create()", message: "Username was not provided"});

	const {db} = await import("./functions/database"),
		user = await db.findOne({collection: "simply-xps", data: {user: userId, guild: guildId}}) as UserResult;

	if (user) return user;
	return await db.createOne({
		collection: "simply-xps", data: {name: username, user: userId, guild: guildId, level: 0, xp: 0}
	}) as UserResult;
}