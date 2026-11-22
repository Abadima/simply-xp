import type { Document } from "mongodb";
import { parseFlags, type UserResult } from "../classes/Database";
import { insertSqliteUser, mongoCollection, sqlite } from "./db";
import { convertFrom, levelFromXpExpr, xpFromLevelExpr } from "./curve";
import { canAutoCreate, requireDatabaseConnection, requireFiniteNumber } from "./guards";
import { LevelRoles } from "../classes/LevelRoles";
import { XpEvents, XpFatal } from "./xplogs";
import { isRecord } from "./predicates";
import { xp } from "../client";

type Field = "level" | "xp";

type MutateOptions = {
	createIfMissing: boolean;
	/** The value being changed; the other one follows from the level curve. */
	field: Field;
	guildId: string;
	mode: "delta" | "set";
	userId: string;
	username?: string;
	value: number;
};

type Mutation = {
	current: UserResult;
	previous: UserResult | null;
};

const callerOf = (field: Field): string => field === "xp" ? "mutateUserXpAtomic()" : "mutateUserLevelAtomic()";
const valueOf = (user: UserResult, field: Field): number => Number((field === "xp" ? user.xp : user.level) || 0);

/** Both stored values for `value` of `field`. */
function valuesFor(field: Field, value: number): { level: number; xp: number } {
	return field === "xp" ? { level: convertFrom(value, "xp"), xp: value } : { level: value, xp: convertFrom(value) };
}

function mongoPipeline(options: MutateOptions, now: string, expression: unknown): Document[] {
	const { field, guildId, userId, username } = options;
	const values = field === "xp"
		? { level: levelFromXpExpr(expression), xp: expression }
		: { level: expression, xp: xpFromLevelExpr(expression) };

	return [{
		$set: {
			createdAt: { $ifNull: ["$createdAt", now] },
			guild: guildId,
			lastUpdated: now,
			...values,
			name: username ?? { $ifNull: ["$name", userId] },
			user: userId,
			xp_rate: xp.xp_rate,
		}
	}];
}

async function mutateMongo(options: MutateOptions, now: string): Promise<Mutation> {
	const { createIfMissing, field, guildId, mode, userId, username, value } = options;
	const caller = callerOf(field);
	const users = mongoCollection("simply-xps");
	const filter = { guild: guildId, user: userId };
	const missing = (): XpFatal => new XpFatal({ function: caller, message: "User does not exist" });

	if (mode === "delta") {
		const delta = Math.floor(value);
		const expression = { $max: [0, { $add: [{ $ifNull: [`$${field}`, 0] }, delta] }] };
		const previousRaw = await users.findOneAndUpdate(
			filter,
			mongoPipeline(options, now, expression),
			{ upsert: createIfMissing, returnDocument: "before" }
		) as UserResult | null;

		if (!previousRaw && !createIfMissing) throw missing();

		const previous = previousRaw ? parseFlags(previousRaw) : null;
		const next = Math.max(0, (previous ? valueOf(previous, field) : 0) + delta);
		return {
			current: {
				_id: previous?._id,
				createdAt: previous?.createdAt || now,
				flags: previous?.flags ?? [],
				guild: guildId,
				lastUpdated: now,
				...valuesFor(field, next),
				name: username ?? previous?.name ?? userId,
				user: userId,
				xp_rate: xp.xp_rate,
			},
			previous,
		};
	}

	const previous = await users.findOne(filter) as UserResult | null;
	if (!previous && !createIfMissing) throw missing();

	const result = await users.updateOne(
		filter,
		mongoPipeline(options, now, Math.max(0, Math.floor(value))),
		{ upsert: createIfMissing }
	);
	if (result.matchedCount === 0 && result.upsertedCount === 0) throw missing();

	const current = await users.findOne(filter) as UserResult | null;
	if (!current) throw new XpFatal({ function: caller, message: "Failed to fetch updated user" });

	return { current: parseFlags(current), previous: previous ? parseFlags(previous) : null };
}

function mutateSqlite(options: MutateOptions, now: string): Mutation {
	const { createIfMissing, field, guildId, mode, userId, username, value } = options;
	const caller = callerOf(field);
	const db = sqlite();
	const find = (): UserResult | undefined => db
		.prepare("SELECT * FROM \"simply-xps\" WHERE guild = ? AND user = ?")
		.get(guildId, userId) as UserResult | undefined;

	const previous = find();
	if (!previous && !createIfMissing) throw new XpFatal({ function: caller, message: "User does not exist" });

	const delta = Math.floor(value);
	const setValue = Math.max(0, delta);
	const initial = valuesFor(field, mode === "set" ? setValue : 0);

	const current = db.transaction((): UserResult | null => {
		if (createIfMissing) {
			insertSqliteUser({ flags: [], guild: guildId, level: initial.level, name: username || userId, now, user: userId, xp: initial.xp, xp_rate: xp.xp_rate });
		}

		if (mode === "set") {
			db.prepare(`UPDATE "simply-xps" SET name = COALESCE(?, name), ${field} = ?, xp_rate = ?, lastUpdated = ? WHERE guild = ? AND user = ?`)
				.run(username, setValue, xp.xp_rate, now, guildId, userId);
		} else {
			db.prepare(`UPDATE "simply-xps" SET name = COALESCE(?, name), ${field} = MAX(0, ${field} + ?), xp_rate = ?, lastUpdated = ? WHERE guild = ? AND user = ?`)
				.run(username, delta, xp.xp_rate, now, guildId, userId);
		}

		const row = find();
		if (!row) return null;

		const next = valuesFor(field, valueOf(row, field));
		db.prepare(`UPDATE "simply-xps" SET ${field === "xp" ? "level" : "xp"} = ?, lastUpdated = ? WHERE guild = ? AND user = ?`)
			.run(field === "xp" ? next.level : next.xp, now, guildId, userId);

		const updated = find();
		return updated ? parseFlags(updated) : null;
	})();

	if (!current) throw new XpFatal({ function: caller, message: "Failed to fetch updated user" });

	return { current, previous: previous ? parseFlags(previous) : null };
}

async function mutateUser(options: MutateOptions): Promise<Mutation> {
	const caller = callerOf(options.field);
	requireDatabaseConnection(caller);

	const now = new Date().toISOString();
	switch (xp.dbType) {
		case "mongodb":
			return mutateMongo(options, now);
		case "sqlite":
			return mutateSqlite(options, now);
		default:
			throw new XpFatal({ function: caller, message: "Unsupported database type" });
	}
}

/**
 * Changes a user's XP or level, then fires `levelUp` / `levelDown`. The user is created when `auto_create` is on and a username is given.
 * @returns The updated user and how many levels it moved.
 */
export async function changeUser(options: Omit<MutateOptions, "createIfMissing">): Promise<{ current: UserResult; levelDifference: number }> {
	const { current, previous } = await mutateUser({ ...options, createIfMissing: canAutoCreate(options.username) });
	return { current, levelDifference: await fireLevelEvents(current, previous, options.userId, options.guildId) };
}

export function resolveXpInput(functionName: string, value: number | { min: number, max: number }): number {
	if (typeof value === "number") {
		requireFiniteNumber(functionName, value, "XP must be a finite number");
		return Math.floor(value);
	}

	if (!isRecord(value)) {
		throw new XpFatal({ function: functionName, message: "XP must be a number or an object with min/max" });
	}

	if (!Number.isFinite(value.min) || !Number.isFinite(value.max)) {
		throw new XpFatal({ function: functionName, message: "XP range min/max must be finite numbers" });
	}

	const min = Math.floor(value.min);
	const max = Math.floor(value.max);
	if (min > max) {
		throw new XpFatal({ function: functionName, message: "XP range requires min <= max" });
	}

	return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function fireLevelEvents(current: UserResult, previous: UserResult | null, userId: string, guildId: string): Promise<number> {
	const levelDifference = previous ? current.level - previous.level : (current.level > 0 ? current.level : 0);

	if (levelDifference < 0) {
		const handlers = XpEvents.handlers("levelDown");
		if (handlers.length > 0) {
			const lostRoles = await LevelRoles.getUserRoles(userId, guildId, { includeNext: true });
			for (const handler of handlers) await handler(current, lostRoles);
		}
	}

	if (levelDifference > 0) {
		const handlers = XpEvents.handlers("levelUp");
		if (handlers.length > 0) {
			const newRoles = await LevelRoles.getUserRoles(userId, guildId);
			for (const handler of handlers) await handler(current, newRoles);
		}
	}

	return levelDifference;
}
