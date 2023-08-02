import {XpFatal} from "./functions/xplogs";

/**
 * Create a new user in the database
 * @async
 * @param {string} guildId
 * @param {string} userId
 * @param {string} username
 * @link `Documentation:` https://simplyxp.js.org/docs/create
 * @returns {Promise<object>}
 * @throws {XpFatal} If invalid parameters are provided
 */
export async function create(guildId: string, userId: string, username: string): Promise<object> {
	if (!guildId) throw new XpFatal({function: "create()", message: "Guild ID was not provided"});
	if (!userId) throw new XpFatal({function: "create()", message: "User ID was not provided"});
	if (!username) throw new XpFatal({function: "create()", message: "Username was not provided"});

	const {db} = await import("./functions/database"),
		user = await db.findOne({collection: "simply-xps", data: {user: userId, guild: guildId}});

	if (user) return user;
	return db.createOne({
		collection: "simply-xps", data: {name: username, user: userId, guild: guildId, level: 0, xp: 0}
	});
}

