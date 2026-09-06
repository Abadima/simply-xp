import { requireDatabaseConnection, requireGuildId, requireUserId } from "./functions/guards";
import { Database, UserResult } from "./classes/Database";
import { XpFatal } from "./functions/xplogs";

/**
 * Create a new user in the database
 * @async
 * @param {string} userId
 * @param {string} guildId
 * @param {string} username
 * @link `Documentation:` https://simplyxp.js.org/docs/functions/create
 * @returns {Promise<UserResult>}
 * @throws {XpFatal} If invalid parameters are provided
 */
export async function create(userId: string, guildId: string, username: string): Promise<UserResult> {
	requireUserId("create()", userId);
	requireGuildId("create()", guildId);

	if (!username) throw new XpFatal({ function: "create()", message: "Username was not provided" });

	requireDatabaseConnection("create()");

	return (await Database.createOne({
		collection: "simply-xps",
		data: {
			guild: guildId,
			user: userId,
			name: username,
		},
	})) as UserResult;
}