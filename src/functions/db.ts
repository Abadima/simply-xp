import type { Database as SQLiteDatabase } from "better-sqlite3";
import type { Collection, Document, MongoClient } from "mongodb";
import { xp } from "../client";

/** The MongoDB client. Only call when `xp.dbType` is `"mongodb"`. */
export const mongo = (): MongoClient => xp.database as MongoClient;

/** A collection of the configured MongoDB database. */
export const mongoCollection = (name: string): Collection<Document> => mongo().db(xp.dbName).collection(name);

/** The better-sqlite3 handle. Only call when `xp.dbType` is `"sqlite"`. */
export const sqlite = (): SQLiteDatabase => xp.database as SQLiteDatabase;

/** Inserts a user row unless that guild + user already has one. */
export function insertSqliteUser(row: {
	flags: Array<number | string>;
	guild: string;
	level: number;
	name: string;
	now: string;
	user: string;
	xp: number;
	xp_rate: number;
}): void {
	sqlite()
		.prepare("INSERT OR IGNORE INTO \"simply-xps\" (user, guild, level, name, xp, xp_rate, flags, createdAt, lastUpdated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
		.run(row.user, row.guild, row.level, row.name, row.xp, row.xp_rate, JSON.stringify(row.flags), row.now, row.now);
}
