const database = require("./database");
const { levelForXP } = require("./curve");

const ZERO = { xp: 0, level: 0 };
const DUPLICATE_KEY = 11000;

const levels = () => database.collection("simply-xps");

const keyOf = (userID, guildID) => ({ user: String(userID), guild: String(guildID) });

const progress = (record) => ({ xp: record?.xp ?? ZERO.xp, level: record?.level ?? ZERO.level });

/** Creates the indexes and drops the legacy one-record-per-user index; never throws. */
async function setup() {
	try {
		const collection = await levels();
		await collection.createIndexes([{ key: { user: 1, guild: 1 }, unique: true }, { key: { guild: 1, xp: -1 } }]);

		const legacy = (await collection.indexes()).find((index) => index.name === "user_1" && index.unique);
		if (legacy) await collection.dropIndex(legacy.name);
	} catch (error) {
		console.warn(`[XP] Could not update the database indexes: ${error.message}`);
	}
}

/** @returns {Promise<{xp: number, level: number}|null>} */
async function find(userID, guildID) {
	const collection = await levels();
	const record = await collection.findOne(keyOf(userID, guildID));
	return record && progress(record);
}

/** Creates the record at zero if missing; `created` says whether it did. */
async function ensure(userID, guildID) {
	const collection = await levels();
	const existing = await collection.findOneAndUpdate(
		keyOf(userID, guildID),
		{ $setOnInsert: ZERO },
		{ upsert: true, includeResultMetadata: false }
	);
	return { ...progress(existing), created: !existing };
}

/** Stores an XP total (min 0) and the level it implies. */
async function write(userID, guildID, xp) {
	const total = Math.max(0, xp);
	const level = levelForXP(total);
	const collection = await levels();
	await collection.updateOne(keyOf(userID, guildID), { $set: { xp: total, level } }, { upsert: true });
	return { xp: total, level };
}

/** Sets the XP to `change(current)` (min 0), retrying with the newer value if it moved in the meantime. */
async function adjust(userID, guildID, change) {
	const collection = await levels();
	const key = keyOf(userID, guildID);

	let saved = null;
	while (!saved) {
		const before = await collection.findOne(key);
		const current = progress(before);
		const xp = Math.max(0, change(current));
		const level = levelForXP(xp);

		try {
			// If the XP moved on, this collides with the existing record and the loop retries.
			await collection.updateOne({ ...key, xp: before?.xp ?? null }, { $set: { xp, level } }, { upsert: true });
			saved = { xp, level, previousLevel: current.level };
		} catch (error) {
			if (error.code !== DUPLICATE_KEY || !(await collection.findOne(key))) throw error;
		}
	}

	return saved;
}

/** 1-based place by XP, counting every record. */
async function positionOf(userID, guildID) {
	const { user, guild } = keyOf(userID, guildID);
	const collection = await levels();
	const cursor = collection.find({ guild }, { projection: { user: 1 } }).sort({ xp: -1 });
	let position = 1;
	try {
		for await (const record of cursor) {
			if (record.user === user) return position;
			position += 1;
		}
		return position;
	} finally {
		await cursor.close();
	}
}

/** @returns {Promise<{userID: string, guildID: string, xp: number, level: number}[]>} Highest XP first. */
async function listByXP(guildID) {
	const collection = await levels();
	const records = await collection
		.find({ guild: String(guildID) })
		.sort({ xp: -1 })
		.toArray();
	return records.map((record) => ({
		userID: record.user,
		guildID: record.guild,
		...progress(record)
	}));
}

/** @param {{userID: string, guildID: string}[]} records */
async function remove(records) {
	const collection = await levels();
	await collection.deleteMany({ $or: records.map(({ userID, guildID }) => keyOf(userID, guildID)) });
}

module.exports = { setup, find, ensure, write, adjust, positionOf, listByXP, remove };
