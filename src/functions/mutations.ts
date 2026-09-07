import { requireDatabaseConnection, requireFiniteNumber } from "./guards";
import { parseFlags, type UserResult } from "../classes/Database";
import type { Database as SQLiteClient } from "better-sqlite3";
import { LevelRoles, convertFrom, xp } from "../../xp";
import type { Document, MongoClient } from "mongodb";
import { XpEvents, XpFatal } from "./xplogs";

type MutateUserXpOptions = {
    createIfMissing: boolean;
    guildId: string;
    mode: "delta" | "set";
    userId: string;
    username?: string;
    value: number;
};

type MutateUserLevelOptions = {
    createIfMissing: boolean;
    guildId: string;
    mode: "delta" | "set";
    userId: string;
    username?: string;
    value: number;
};

export async function mutateUserXpAtomic(options: MutateUserXpOptions): Promise<{
    current: UserResult;
    previous: UserResult | null;
}> {
    requireDatabaseConnection("mutateUserXpAtomic()");
    requireFiniteNumber("mutateUserXpAtomic()", options.value, "XP value must be finite");

    const now = new Date().toISOString();

    switch (xp.dbType) {
        case "mongodb": {
            const collection = (xp.database as MongoClient).db(xp.dbName).collection("simply-xps");
            const normalizedSetXp = normalizeNonNegativeInteger(options.value);
            const normalizedDelta = normalizeInteger(options.value);

            if (options.mode === "delta") {
                const deltaXpExpr = { $max: [0, { $add: [{ $ifNull: ["$xp", 0] }, normalizedDelta] }] };
                const previousRaw = await collection.findOneAndUpdate(
                    { guild: options.guildId, user: options.userId },
                    [{
                        $set: {
                            createdAt: { $ifNull: ["$createdAt", now] },
                            guild: options.guildId,
                            lastUpdated: now,
                            level: {
                                $floor: {
                                    $multiply: [
                                        xp.xp_rate,
                                        { $sqrt: deltaXpExpr }
                                    ]
                                }
                            },
                            name: options.username ?? { $ifNull: ["$name", options.userId] },
                            user: options.userId,
                            xp: deltaXpExpr,
                            xp_rate: xp.xp_rate,
                        }
                    }] as unknown as Document[],
                    { upsert: options.createIfMissing, returnDocument: "before" }
                ) as UserResult | null;

                if (!previousRaw && !options.createIfMissing) {
                    throw new XpFatal({ function: "mutateUserXpAtomic()", message: "User does not exist" });
                }

                const previous = previousRaw ? parseFlags(previousRaw) : null;
                const previousXp = Number(previous?.xp || 0);
                const currentXp = Math.max(0, previousXp + normalizedDelta);
                const current: UserResult = {
                    _id: previous?._id,
                    createdAt: previous?.createdAt || now,
                    flags: previous?.flags ?? [],
                    guild: options.guildId,
                    lastUpdated: now,
                    level: convertFrom(currentXp, "xp"),
                    name: options.username ?? previous?.name ?? options.userId,
                    user: options.userId,
                    xp: currentXp,
                    xp_rate: xp.xp_rate,
                };

                return { current, previous };
            }

            const previous = await collection.findOne({ guild: options.guildId, user: options.userId }) as UserResult | null;
            if (!previous && !options.createIfMissing) {
                throw new XpFatal({ function: "mutateUserXpAtomic()", message: "User does not exist" });
            }

            const baseXpExpr = { $ifNull: ["$xp", 0] };
            const nextXpExpr = options.mode === "set"
                ? normalizedSetXp
                : { $max: [0, { $add: [baseXpExpr, normalizedDelta] }] };
            const nextLevelExpr = {
                $floor: {
                    $multiply: [
                        xp.xp_rate,
                        { $sqrt: nextXpExpr }
                    ]
                }
            };

            const result = await collection.updateOne(
                { guild: options.guildId, user: options.userId },
                [{
                    $set: {
                        createdAt: { $ifNull: ["$createdAt", now] },
                        guild: options.guildId,
                        lastUpdated: now,
                        level: nextLevelExpr,
                        name: options.username ?? { $ifNull: ["$name", options.userId] },
                        user: options.userId,
                        xp: nextXpExpr,
                        xp_rate: xp.xp_rate,
                    }
                }] as unknown as Document[],
                { upsert: options.createIfMissing }
            );

            if (result.matchedCount === 0 && result.upsertedCount === 0) {
                throw new XpFatal({ function: "mutateUserXpAtomic()", message: "User does not exist" });
            }

            const current = await collection.findOne({ guild: options.guildId, user: options.userId }) as UserResult | null;
            if (!current) throw new XpFatal({ function: "mutateUserXpAtomic()", message: "Failed to fetch updated user" });

            return {
                current: parseFlags(current),
                previous: previous ? parseFlags(previous) : null,
            };
        }

        case "sqlite": {
            const db = xp.database as SQLiteClient;
            const previous = db.prepare("SELECT * FROM \"simply-xps\" WHERE guild = ? AND user = ?")
                .get(options.guildId, options.userId) as UserResult | undefined;
            if (!previous && !options.createIfMissing) {
                throw new XpFatal({ function: "mutateUserXpAtomic()", message: "User does not exist" });
            }

            const normalizedSetXp = normalizeNonNegativeInteger(options.value);
            const normalizedDelta = normalizeInteger(options.value);
            const initialXp = options.mode === "set" ? normalizedSetXp : 0;

            const transaction = db.transaction((): UserResult | null => {
                if (options.createIfMissing) {
                    db.prepare("INSERT OR IGNORE INTO \"simply-xps\" (user, guild, level, name, xp, xp_rate, flags, createdAt, lastUpdated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
                        .run(
                            options.userId,
                            options.guildId,
                            convertFrom(initialXp, "xp"),
                            options.username || options.userId,
                            initialXp,
                            xp.xp_rate,
                            JSON.stringify([]),
                            now,
                            now
                        );
                }

                if (options.mode === "set") {
                    db.prepare("UPDATE \"simply-xps\" SET name = COALESCE(?, name), xp = ?, xp_rate = ?, lastUpdated = ? WHERE guild = ? AND user = ?")
                        .run(options.username, normalizedSetXp, xp.xp_rate, now, options.guildId, options.userId);
                } else {
                    db.prepare("UPDATE \"simply-xps\" SET name = COALESCE(?, name), xp = MAX(0, xp + ?), xp_rate = ?, lastUpdated = ? WHERE guild = ? AND user = ?")
                        .run(options.username, normalizedDelta, xp.xp_rate, now, options.guildId, options.userId);
                }

                const row = db.prepare("SELECT * FROM \"simply-xps\" WHERE guild = ? AND user = ?")
                    .get(options.guildId, options.userId) as UserResult | undefined;
                if (!row) return null;

                db.prepare("UPDATE \"simply-xps\" SET level = ?, lastUpdated = ? WHERE guild = ? AND user = ?")
                    .run(convertFrom(Number(row.xp || 0), "xp"), now, options.guildId, options.userId);

                const updated = db.prepare("SELECT * FROM \"simply-xps\" WHERE guild = ? AND user = ?")
                    .get(options.guildId, options.userId) as UserResult | undefined;
                if (!updated) return null;

                return parseFlags(updated);
            });

            const current = transaction();
            if (!current) throw new XpFatal({ function: "mutateUserXpAtomic()", message: "Failed to fetch updated user" });

            return {
                current,
                previous: previous ? parseFlags(previous) : null,
            };
        }

        default:
            throw new XpFatal({ function: "mutateUserXpAtomic()", message: "Unsupported database type" });
    }
}

export async function mutateUserLevelAtomic(options: MutateUserLevelOptions): Promise<{
    current: UserResult;
    previous: UserResult | null;
}> {
    requireDatabaseConnection("mutateUserLevelAtomic()");
    requireFiniteNumber("mutateUserLevelAtomic()", options.value, "Level value must be finite");

    const now = new Date().toISOString();

    switch (xp.dbType) {
        case "mongodb": {
            const collection = (xp.database as MongoClient).db(xp.dbName).collection("simply-xps");
            const normalizedSetLevel = normalizeNonNegativeInteger(options.value);
            const normalizedDelta = normalizeInteger(options.value);

            if (options.mode === "delta") {
                const deltaLevelExpr = { $max: [0, { $add: [{ $ifNull: ["$level", 0] }, normalizedDelta] }] };
                const previousRaw = await collection.findOneAndUpdate(
                    { guild: options.guildId, user: options.userId },
                    [{
                        $set: {
                            createdAt: { $ifNull: ["$createdAt", now] },
                            guild: options.guildId,
                            lastUpdated: now,
                            level: deltaLevelExpr,
                            name: options.username ?? { $ifNull: ["$name", options.userId] },
                            user: options.userId,
                            xp: {
                                $pow: [
                                    { $divide: [deltaLevelExpr, xp.xp_rate] },
                                    2
                                ]
                            },
                            xp_rate: xp.xp_rate,
                        }
                    }] as unknown as Document[],
                    { upsert: options.createIfMissing, returnDocument: "before" }
                ) as UserResult | null;

                if (!previousRaw && !options.createIfMissing) {
                    throw new XpFatal({ function: "mutateUserLevelAtomic()", message: "User does not exist" });
                }

                const previous = previousRaw ? parseFlags(previousRaw) : null;
                const previousLevel = Number(previous?.level || 0);
                const currentLevel = Math.max(0, previousLevel + normalizedDelta);
                const current: UserResult = {
                    _id: previous?._id,
                    createdAt: previous?.createdAt || now,
                    flags: previous?.flags ?? [],
                    guild: options.guildId,
                    lastUpdated: now,
                    level: currentLevel,
                    name: options.username ?? previous?.name ?? options.userId,
                    user: options.userId,
                    xp: convertFrom(currentLevel),
                    xp_rate: xp.xp_rate,
                };

                return { current, previous };
            }

            const previous = await collection.findOne({ guild: options.guildId, user: options.userId }) as UserResult | null;
            if (!previous && !options.createIfMissing) {
                throw new XpFatal({ function: "mutateUserLevelAtomic()", message: "User does not exist" });
            }

            const baseLevelExpr = { $ifNull: ["$level", 0] };
            const nextLevelExpr = options.mode === "set"
                ? normalizedSetLevel
                : { $max: [0, { $add: [baseLevelExpr, normalizedDelta] }] };
            const nextXpExpr = {
                $pow: [
                    { $divide: [nextLevelExpr, xp.xp_rate] },
                    2
                ]
            };

            const result = await collection.updateOne(
                { guild: options.guildId, user: options.userId },
                [{
                    $set: {
                        createdAt: { $ifNull: ["$createdAt", now] },
                        guild: options.guildId,
                        lastUpdated: now,
                        level: nextLevelExpr,
                        name: options.username ?? { $ifNull: ["$name", options.userId] },
                        user: options.userId,
                        xp: nextXpExpr,
                        xp_rate: xp.xp_rate,
                    }
                }] as unknown as Document[],
                { upsert: options.createIfMissing }
            );

            if (result.matchedCount === 0 && result.upsertedCount === 0) {
                throw new XpFatal({ function: "mutateUserLevelAtomic()", message: "User does not exist" });
            }

            const current = await collection.findOne({ guild: options.guildId, user: options.userId }) as UserResult | null;
            if (!current) throw new XpFatal({ function: "mutateUserLevelAtomic()", message: "Failed to fetch updated user" });

            return {
                current: parseFlags(current),
                previous: previous ? parseFlags(previous) : null,
            };
        }

        case "sqlite": {
            const db = xp.database as SQLiteClient;
            const previous = db.prepare("SELECT * FROM \"simply-xps\" WHERE guild = ? AND user = ?")
                .get(options.guildId, options.userId) as UserResult | undefined;
            if (!previous && !options.createIfMissing) {
                throw new XpFatal({ function: "mutateUserLevelAtomic()", message: "User does not exist" });
            }

            const normalizedSetLevel = normalizeNonNegativeInteger(options.value);
            const normalizedDelta = normalizeInteger(options.value);
            const initialLevel = options.mode === "set" ? normalizedSetLevel : 0;

            const transaction = db.transaction((): UserResult | null => {
                if (options.createIfMissing) {
                    db.prepare("INSERT OR IGNORE INTO \"simply-xps\" (user, guild, level, name, xp, xp_rate, flags, createdAt, lastUpdated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
                        .run(
                            options.userId,
                            options.guildId,
                            initialLevel,
                            options.username || options.userId,
                            convertFrom(initialLevel),
                            xp.xp_rate,
                            JSON.stringify([]),
                            now,
                            now
                        );
                }

                if (options.mode === "set") {
                    db.prepare("UPDATE \"simply-xps\" SET name = COALESCE(?, name), level = ?, xp_rate = ?, lastUpdated = ? WHERE guild = ? AND user = ?")
                        .run(options.username, normalizedSetLevel, xp.xp_rate, now, options.guildId, options.userId);
                } else {
                    db.prepare("UPDATE \"simply-xps\" SET name = COALESCE(?, name), level = MAX(0, level + ?), xp_rate = ?, lastUpdated = ? WHERE guild = ? AND user = ?")
                        .run(options.username, normalizedDelta, xp.xp_rate, now, options.guildId, options.userId);
                }

                const row = db.prepare("SELECT * FROM \"simply-xps\" WHERE guild = ? AND user = ?")
                    .get(options.guildId, options.userId) as UserResult | undefined;
                if (!row) return null;

                db.prepare("UPDATE \"simply-xps\" SET xp = ?, lastUpdated = ? WHERE guild = ? AND user = ?")
                    .run(convertFrom(Number(row.level || 0)), now, options.guildId, options.userId);

                const updated = db.prepare("SELECT * FROM \"simply-xps\" WHERE guild = ? AND user = ?")
                    .get(options.guildId, options.userId) as UserResult | undefined;
                if (!updated) return null;

                return parseFlags(updated);
            });

            const current = transaction();
            if (!current) throw new XpFatal({ function: "mutateUserLevelAtomic()", message: "Failed to fetch updated user" });

            return {
                current,
                previous: previous ? parseFlags(previous) : null,
            };
        }

        default:
            throw new XpFatal({ function: "mutateUserLevelAtomic()", message: "Unsupported database type" });
    }
}

function normalizeInteger(value: number): number {
    return Math.floor(value);
}

function normalizeNonNegativeInteger(value: number): number {
    return Math.max(0, normalizeInteger(value));
}

export function resolveXpInput(functionName: string, value: number | { min: number, max: number }): number {
    if (typeof value === "number") {
        requireFiniteNumber(functionName, value, "XP must be a finite number");
        return normalizeInteger(value);
    }

    if (!value || typeof value !== "object") {
        throw new XpFatal({ function: functionName, message: "XP must be a number or an object with min/max" });
    }

    if (!Number.isFinite(value.min) || !Number.isFinite(value.max)) {
        throw new XpFatal({ function: functionName, message: "XP range min/max must be finite numbers" });
    }

    const min = normalizeInteger(value.min);
    const max = normalizeInteger(value.max);
    if (min > max) {
        throw new XpFatal({ function: functionName, message: "XP range requires min <= max" });
    }

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function fireLevelEvents(
    current: UserResult,
    previous: UserResult | null,
    userId: string,
    guildId: string
): Promise<number> {
    const levelDifference = previous ? current.level - previous.level : (current.level > 0 ? current.level : 0);

    if (levelDifference < 0) {
        const handlers = XpEvents.handlers("levelDown");
        if (handlers.length > 0) {
            // Resolved once and shared, so extra listeners cost no extra queries.
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
