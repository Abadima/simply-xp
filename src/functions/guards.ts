import { XpFatal } from "./xplogs";
import { isIdentifier, isRecord } from "./predicates";
import { xp } from "../client";


export function requireValue(functionName: string, value: unknown, message: string): void {
    if (!value) throw new XpFatal({ function: functionName, message });
}

export function requireUserId(functionName: string, userId: string): void {
    requireValue(functionName, userId, "User ID was not provided");
    if (!isIdentifier(userId)) throw new XpFatal({ function: functionName, message: "User ID must be a string" });
}

export function requireGuildId(functionName: string, guildId: string): void {
    requireValue(functionName, guildId, "Guild ID was not provided");
    if (!isIdentifier(guildId)) throw new XpFatal({ function: functionName, message: "Guild ID must be a string" });
}

/** Whether a missing user may be created: `auto_create` is on and the caller gave a username. */
export const canAutoCreate = (username: string | undefined): username is string => Boolean(xp.auto_create && username);

export function requireIds(functionName: string, userId: string, guildId: string): void {
    requireUserId(functionName, userId);
    requireGuildId(functionName, guildId);
}

export function requireFiniteNumber(functionName: string, value: number, message: string): void {
    if (!Number.isFinite(value)) throw new XpFatal({ function: functionName, message });
}

export const requireDatabaseConnection = (functionName: string): void => requireValue(functionName, xp.database, "No database connection");



/** Options as given by a JavaScript caller: the object itself, or `{}` for anything else. */
export const optionsOf = <T extends object>(value: T | null | undefined): T => (isRecord(value) ? value : {}) as T;

/** True when `value` is an object whose `keys` all hold truthy values, whatever a JavaScript caller passed. */
export const hasFields = (value: unknown, ...keys: string[]): boolean =>
    isRecord(value) && keys.every((key) => Boolean(Reflect.get(value as object, key)));
