import { Database, type UserResult } from "../classes/Database";
import { create } from "../create";
import { canAutoCreate } from "./guards";

/** The user's row, or `null` when they have none. */
export const findUser = (guildId: string, userId: string): Promise<UserResult | null> =>
	Database.findOne({ collection: "simply-xps", data: { guild: guildId, user: userId } }) as Promise<UserResult | null>;

/** The user's row. A missing user is created when `auto_create` is on and a username is given; otherwise `null`. */
export async function findOrCreateUser(guildId: string, userId: string, username: string | undefined): Promise<UserResult | null> {
	const user = await findUser(guildId, userId);
	if (user || !canAutoCreate(username)) return user;
	return create(userId, guildId, username);
}

/** 1-based place of a user with `xpValue` XP in the guild. */
export async function positionOf(guildId: string, xpValue: number): Promise<number> {
	return 1 + await Database.countUsersWithMoreXp(guildId, xpValue);
}
