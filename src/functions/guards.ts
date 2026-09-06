import { XpFatal } from "./xplogs";
import { xp } from "../../xp";


function requireValue(functionName: string, value: unknown, message: string): void {
    if (!value) throw new XpFatal({ function: functionName, message });
}

export const requireUserId = (functionName: string, userId: string): void => requireValue(functionName, userId, "User ID was not provided");

export const requireGuildId = (functionName: string, guildId: string): void => requireValue(functionName, guildId, "Guild ID was not provided");

export function requireFiniteNumber(functionName: string, value: number, message: string): void {
    if (!Number.isFinite(value)) throw new XpFatal({ function: functionName, message });
}

export const requireDatabaseConnection = (functionName: string): void => requireValue(functionName, xp.database, "No database connection");
