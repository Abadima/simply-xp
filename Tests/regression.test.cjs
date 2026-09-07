const { checkPackageVersion } = require("../lib/src/connect");
const { existsSync } = require("fs");
const assert = require("assert");
const { EventEmitter } = require("events");
const { performance } = require("perf_hooks");
const xp = require("../lib/xp");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const LOG_INDENT = "  ";
let logDepth = 0;

function formatDuration(ms) {
    return `${ms.toFixed(6)}ms`;
}

function printWithIndent(message) {
    console.log(`${LOG_INDENT.repeat(logDepth)}${message}`);
}

async function runCase(name, callback) {
    const startedAt = performance.now();
    try {
        await callback();
        printWithIndent(`✔ ${name} (${formatDuration(performance.now() - startedAt)})`);
    } catch (error) {
        printWithIndent(`✖ ${name} (${formatDuration(performance.now() - startedAt)})`);
        throw error;
    }
}

async function runGroup(name, callback) {
    const startedAt = performance.now();
    printWithIndent(`▶ ${name}`);
    logDepth += 1;
    try {
        await callback();
    } catch (error) {
        logDepth -= 1;
        printWithIndent(`✖ ${name} (${formatDuration(performance.now() - startedAt)})`);
        throw error;
    }

    logDepth -= 1;
    printWithIndent(`✔ ${name} (${formatDuration(performance.now() - startedAt)})`);
}

function printSkip(name) {
    printWithIndent(`○ ${name} (skipped)`);
}

function loadMongoUri() {
    if (!existsSync("secrets.cjs")) return null;
    return require("../secrets.cjs").MongoURI;
}

async function connectAdapter(type) {
    if (type === "sqlite") {
        await xp.connect("Tests/regression.sqlite", {
            type: "sqlite",
            auto_create: true,
            notify: false,
            debug: false
        });
        return;
    }

    const mongoUri = loadMongoUri();
    assert.ok(mongoUri, "Expected secrets.cjs to contain MongoURI for MongoDB regression coverage");
    await xp.connect(mongoUri, {
        type: "mongodb",
        auto_create: true,
        notify: false,
        debug: false
    });
}

async function clearGuild(guildId) {
    await xp.Database.deleteMany({ collection: "simply-xps", data: { guild: guildId } });
    await xp.Database.deleteMany({ collection: "simply-xp-levelroles", data: { guild: guildId } });
}

function normalizeUser(user) {
    return {
        flags: [...(user.flags || [])].sort(),
        guild: user.guild,
        level: user.level,
        name: user.name,
        position: user.position,
        user: user.user,
        xp: user.xp
    };
}

function normalizeLeaderboard(users) {
    return users.map((user) => ({
        flags: [...(user.flags || [])].sort(),
        level: user.level,
        name: user.name,
        position: user.position,
        user: user.user,
        xp: user.xp
    }));
}

async function testDeprecatedAliasesRemoved() {
    assert.strictEqual(xp.db, undefined, "Expected top-level export `db` to be removed");
    assert.strictEqual(xp.migrate, undefined, "Expected top-level export `migrate` to be removed");
}

async function testBundledFontIsPackaged() {
    const { GlobalFonts } = require("@napi-rs/canvas");
    const fontPath = require("path").join(__dirname, "..", "lib", "src", "fonts", "Baloo2-Regular.woff2");

    assert.ok(
        existsSync(fontPath),
        "Expected the bundled Baloo font to exist in lib/ — tsc does not copy assets, so the build must copy it (see Tests/clean.mjs)"
    );

    // registerFromPath() returns null instead of throwing on a missing file, so a
    // missing font would otherwise degrade card rendering silently.
    assert.ok(
        GlobalFonts.registerFromPath(fontPath, "BundledFontRegressionCheck"),
        "Expected the bundled Baloo font to register with @napi-rs/canvas"
    );
}

async function testMissingAdapterThrowsCatchableFatal() {
    await assert.rejects(
        () => checkPackageVersion("@simply-xp/definitely-missing-adapter", 1),
        (error) => {
            assert.strictEqual(error?.name, "SimplyXpFatal", "Expected missing adapter to throw SimplyXpFatal");
            assert.strictEqual(error?.code, "SX_ADAPTER_MISSING", "Expected missing adapter error code to be SX_ADAPTER_MISSING");
            return true;
        }
    );
}

async function testAsyncCallbacksAreAwaited() {
    const guildId = "regression-guild";
    const userId = "regression-user";

    await connectAdapter("sqlite");
    await clearGuild(guildId);

    let levelUpAwaited = false;
    let levelDownAwaited = false;

    xp.XpEvents.on({
        levelUp: async () => {
            await wait(25);
            levelUpAwaited = true;
        },
        levelDown: async () => {
            await wait(25);
            levelDownAwaited = true;
        }
    });

    await xp.setLevel(userId, guildId, 0, "RegressionUser");
    await xp.setXP(userId, guildId, 400, "RegressionUser");
    assert.strictEqual(levelUpAwaited, true, "Expected setXP() to await async levelUp callback");

    await xp.setXP(userId, guildId, 100, "RegressionUser");
    assert.strictEqual(levelDownAwaited, true, "Expected setXP() to await async levelDown callback");

    await clearGuild(guildId);
}

async function testMongoDbNameThreadingViaUpdateOptions() {
    const requestedDbName = "regression-db-name";
    let capturedDbNames = [];

    const fakeCollection = {
        deleteMany: async () => ({ deletedCount: 0 }),
        findOne: async () => ({ _id: "schema", schemaVersion: 2 }),
        updateMany: async () => ({ matchedCount: 0, modifiedCount: 0 }),
        updateOne: async () => ({}),
        find: () => ({ toArray: async () => [] })
    };

    const fakeMongoClient = {
        db: (name) => {
            capturedDbNames.push(name);
            return {
                command: async () => ({ ok: 1 }),
                collection: () => fakeCollection,
                listCollections: () => ({ hasNext: async () => false })
            };
        }
    };

    xp.updateOptions({
        auto_create: false,
        debug: false,
        notify: false,
        dbOptions: {
            type: "mongodb",
            database: fakeMongoClient,
            name: requestedDbName
        }
    });

    await wait(50);

    assert.strictEqual(xp.xp.dbName, requestedDbName, "Expected xp.dbName to use dbOptions.name");
    assert.ok(capturedDbNames.includes(requestedDbName), "Expected internal MongoDB calls to use dbOptions.name");
}

async function testHttpsHelperBehavior() {
    const httpsModule = require("https");
    const originalRequest = httpsModule.request;

    try {
        let capturedOptions;

        httpsModule.request = (options, callback) => {
            capturedOptions = options;
            const requestEmitter = new EventEmitter();
            requestEmitter.write = () => { };
            requestEmitter.destroy = () => { };
            requestEmitter.end = () => {
                const responseEmitter = new EventEmitter();
                responseEmitter.statusCode = 200;
                callback(responseEmitter);
                process.nextTick(() => {
                    responseEmitter.emit("data", Buffer.from(JSON.stringify({ ok: true })));
                    responseEmitter.emit("end");
                });
            };
            return requestEmitter;
        };

        const response = await xp.https("https://unit.test/path?from=query", {
            body: { ping: true },
            endpoint: "/custom-endpoint",
            method: "POST",
            responseType: "json",
            statusCode: 200,
        });

        assert.deepStrictEqual(response, { ok: true }, "Expected https() to decode JSON payloads");
        assert.strictEqual(capturedOptions.path, "/custom-endpoint", "Expected https() to honor endpoint override");
        assert.strictEqual(capturedOptions.method, "POST", "Expected https() to pass method through to request options");

        let destroyed = false;
        httpsModule.request = () => {
            const requestEmitter = new EventEmitter();
            requestEmitter.write = () => { };
            requestEmitter.end = () => { };
            requestEmitter.destroy = () => {
                destroyed = true;
            };
            return requestEmitter;
        };

        await assert.rejects(
            () => xp.https("https://unit.test/timeout", { timeout: 10 }),
            (error) => {
                assert.strictEqual(error?.status, 408, "Expected timeout rejections to use status 408");
                return true;
            }
        );

        assert.strictEqual(destroyed, true, "Expected timed out https() requests to destroy the underlying request");
    } finally {
        httpsModule.request = originalRequest;
    }
}

async function testConcurrentWrites(type) {
    const guildId = `${type}-concurrency-guild`;
    const userId = `${type}-concurrency-user`;

    await connectAdapter(type);
    await clearGuild(guildId);

    await Promise.all(Array.from({ length: 10 }, () => xp.addXP(userId, guildId, 10, "ConcurrentUser")));
    let user = await xp.fetch(userId, guildId, "ConcurrentUser");
    assert.strictEqual(user.xp, 100, `Expected concurrent addXP() to preserve all writes for ${type}`);
    assert.deepStrictEqual(user.flags, [], `Expected concurrent addXP() to leave flags untouched (opaque, developer-owned data) for ${type}`);

    await Promise.all(Array.from({ length: 4 }, () => xp.removeXP(userId, guildId, 5, "ConcurrentUser")));
    user = await xp.fetch(userId, guildId, "ConcurrentUser");
    assert.strictEqual(user.xp, 80, `Expected concurrent removeXP() to preserve all writes for ${type}`);

    await Promise.all(Array.from({ length: 5 }, () => xp.setXP(userId, guildId, 250, "ConcurrentUser")));
    user = await xp.fetch(userId, guildId, "ConcurrentUser");
    assert.strictEqual(user.xp, 250, `Expected concurrent setXP() to converge on the requested value for ${type}`);
    assert.strictEqual(user.level, Math.floor(xp.xp.xp_rate * Math.sqrt(250)), `Expected level to stay in sync after concurrent setXP() for ${type}`);

    await clearGuild(guildId);
}

async function testCreateIsIdempotentOnExistingUser(type) {
    const guildId = `${type}-create-idempotent-guild`;
    const userId = `${type}-create-idempotent-user`;

    await connectAdapter(type);
    await clearGuild(guildId);

    const first = await xp.create(userId, guildId, "FirstName");
    assert.strictEqual(first.name, "FirstName", `Expected the first create() to use the provided name for ${type}`);
    assert.strictEqual(first.xp, 0, `Expected a freshly created user to start at 0 xp for ${type}`);

    // create() on an existing user must be a safe no-op on both adapters, not an error and
    // not a silent overwrite. SQLite enforces this with INSERT OR IGNORE; MongoDB needs the
    // matching upsert-with-$setOnInsert behavior in Database.createOne() to agree.
    const second = await xp.create(userId, guildId, "SecondName");
    assert.strictEqual(second.name, "FirstName", `Expected create() on an existing user to keep the original name for ${type}, not overwrite it`);
    assert.strictEqual(second.user, first.user, `Expected create() on an existing user to return the same user for ${type}`);

    await clearGuild(guildId);
}

async function testTieRankingParity(type) {
    const guildId = `${type}-tie-guild`;
    const userIds = ["tie-a", "tie-b", "tie-c"];

    await connectAdapter(type);
    await clearGuild(guildId);

    for (const userId of userIds) {
        await xp.setXP(userId, guildId, 100, userId.toUpperCase());
    }

    for (let index = 0; index < 5; index++) {
        const leaderboard = await xp.leaderboard(guildId);
        const tiedUsers = leaderboard.slice(0, userIds.length);

        assert.ok(
            tiedUsers.every((user) => user.position === 1),
            `Expected shared leaderboard positions for tied XP users on ${type}`
        );

        for (const userId of userIds) {
            const fetched = await xp.fetch(userId, guildId, userId.toUpperCase());
            assert.strictEqual(
                fetched.position,
                1,
                `Expected fetch() position to match leaderboard tie ranking for ${type}`
            );
        }
    }

    await clearGuild(guildId);
}

async function testXpRateBulkSync(type) {
    const guildId = `${type}-xp-rate-guild`;

    await connectAdapter(type);
    await clearGuild(guildId);

    await xp.setXP("rate-a", guildId, 100, "RateA");
    await xp.setXP("rate-b", guildId, 400, "RateB");

    if (type === "sqlite") {
        xp.xp.database.prepare("UPDATE \"simply-xps\" SET xp_rate = ?, level = ? WHERE guild = ?").run(0.1, 0, guildId);
    } else {
        await xp.xp.database
            .db(xp.xp.dbName)
            .collection("simply-xps")
            .updateMany({ guild: guildId }, { $set: { xp_rate: 0.1, level: 0 } });
    }

    await xp.updateOptions({ xp_rate: 0.5 });

    const rows = await xp.Database.find("simply-xps", guildId);
    for (const row of rows) {
        assert.strictEqual(row.xp_rate, 0.5, `Expected xp_rate mismatch rows to be bulk-updated for ${type}`);
        assert.strictEqual(
            row.level,
            Math.floor(0.5 * Math.sqrt(row.xp)),
            `Expected level to be recalculated during bulk xp_rate sync for ${type}`
        );
    }

    await xp.updateOptions({ xp_rate: 0.1 });
    await clearGuild(guildId);
}

async function testSqliteGuildColumnMigration() {
    const BetterSqlite3 = require("better-sqlite3");
    const fs = require("fs");
    const dbPath = "Tests/regression-guild-column.sqlite";
    const guildId = "sqlite-migration-guild";

    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

    const legacyDb = new BetterSqlite3(dbPath);
    legacyDb.exec(`
        CREATE TABLE "simply-xps" (
            user        TEXT    NOT NULL,
            guild       TEXT    NOT NULL,
            name        TEXT    NOT NULL DEFAULT user,
            level       INTEGER NOT NULL DEFAULT 0,
            flags       TEXT             DEFAULT NULL,
            xp          INTEGER NOT NULL DEFAULT 0,
            voice_xp    INTEGER          DEFAULT 0,
            voice_time  INTEGER          DEFAULT 0,
            xp_rate     INTEGER          DEFAULT 0.1,
            createdAt   DATE    NOT NULL DEFAULT (datetime('now')),
            lastUpdated DATE    NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE "simply-xp-levelroles" (
            gid         TEXT    NOT NULL,
            levelrole   TEXT    NOT NULL,
            createdAt   DATE    NOT NULL DEFAULT (datetime('now')),
            lastUpdated DATE    NOT NULL DEFAULT (datetime('now'))
        );
    `);

    legacyDb
        .prepare("INSERT INTO \"simply-xp-levelroles\" (gid, levelrole, createdAt, lastUpdated) VALUES (?, ?, datetime('now'), datetime('now'))")
        .run(guildId, JSON.stringify({ level: 2, roles: ["role-1"] }));
    legacyDb.close();

    await xp.connect(dbPath, {
        type: "sqlite",
        auto_create: true,
        notify: false,
        debug: false,
    });

    const columns = xp.xp.database.prepare("PRAGMA table_info(\"simply-xp-levelroles\")").all();
    assert.ok(columns.some((column) => column.name === "guild"), "Expected SQLite migration to create or rename guild column");

    const roles = await xp.LevelRoles.getGuildRoles(guildId);
    assert.strictEqual(roles.length, 1, "Expected migrated level-role row to remain readable after gid->guild migration");
    assert.strictEqual(roles[0].guild, guildId, "Expected migrated level-role row to expose guild field");

    await clearGuild(guildId);
}

async function testMigrateFromDbMongoPathIntoSqlite() {
    const guildId = "migrate-fromdb-guild";
    const userId = "migrate-fromdb-user";

    await connectAdapter("sqlite");
    await clearGuild(guildId);

    const fakeMongoConnection = {
        db: () => ({
            collection: () => ({
                find: () => ({
                    toArray: async () => ([{
                        flags: null,
                        guild: guildId,
                        level: 4,
                        name: "MigratedUser",
                        user: userId,
                        xp: 1600,
                    }]),
                }),
            }),
        }),
    };

    const migrated = await xp.Migrate.fromDB("mongodb", fakeMongoConnection);
    assert.strictEqual(migrated, true, "Expected Migrate.fromDB() to succeed for mongodb input path");

    const user = await xp.fetch(userId, guildId, "MigratedUser");
    assert.strictEqual(user.level, 4, "Expected migrated user level to match source level");
    assert.deepStrictEqual(user.flags, [], "Expected migrated users to expose normalized empty flags array");

    await clearGuild(guildId);
}

async function testFlagsRemainOpaqueAcrossMutations(type) {
    const guildId = `${type}-flags-guild`;
    const userId = `${type}-flags-user`;

    await connectAdapter(type);
    await clearGuild(guildId);

    // Flags are developer-defined; XP/level mutations must not add, remove, or read them.
    const customFlags = ["illegal", "vip"];

    await xp.setFlags(userId, guildId, customFlags, "FlagUser");
    let user = await xp.fetch(userId, guildId, "FlagUser");
    assert.deepStrictEqual([...(user.flags || [])].sort(), [...customFlags].sort(), `Expected initial manual flags to persist for ${type}`);

    await xp.addXP(userId, guildId, 25, "FlagUser");
    user = await xp.fetch(userId, guildId, "FlagUser");
    assert.deepStrictEqual([...(user.flags || [])].sort(), [...customFlags].sort(), `Expected addXP() to leave developer-set flags untouched for ${type}`);
    assert.ok(!user.flags.includes("modified"), `Expected addXP() to not introduce a "modified" flag for ${type}`);

    await xp.removeXP(userId, guildId, 5, "FlagUser");
    user = await xp.fetch(userId, guildId, "FlagUser");
    assert.deepStrictEqual([...(user.flags || [])].sort(), [...customFlags].sort(), `Expected removeXP() to leave developer-set flags untouched for ${type}`);
    assert.ok(!user.flags.includes("modified"), `Expected removeXP() to not introduce a "modified" flag for ${type}`);

    await xp.setXP(userId, guildId, 100, "FlagUser");
    user = await xp.fetch(userId, guildId, "FlagUser");
    assert.deepStrictEqual([...(user.flags || [])].sort(), [...customFlags].sort(), `Expected setXP() to leave developer-set flags untouched for ${type}`);
    assert.ok(!user.flags.includes("modified"), `Expected setXP() to not introduce a "modified" flag for ${type}`);

    await xp.addLevel(userId, guildId, 1, "FlagUser");
    user = await xp.fetch(userId, guildId, "FlagUser");
    assert.deepStrictEqual([...(user.flags || [])].sort(), [...customFlags].sort(), `Expected addLevel() to leave developer-set flags untouched for ${type}`);
    assert.ok(!user.flags.includes("modified"), `Expected addLevel() to not introduce a "modified" flag for ${type}`);

    await xp.removeLevel(userId, guildId, 1, "FlagUser");
    user = await xp.fetch(userId, guildId, "FlagUser");
    assert.deepStrictEqual([...(user.flags || [])].sort(), [...customFlags].sort(), `Expected removeLevel() to leave developer-set flags untouched for ${type}`);
    assert.ok(!user.flags.includes("modified"), `Expected removeLevel() to not introduce a "modified" flag for ${type}`);

    await xp.setLevel(userId, guildId, 5, "FlagUser");
    user = await xp.fetch(userId, guildId, "FlagUser");
    assert.deepStrictEqual([...(user.flags || [])].sort(), [...customFlags].sort(), `Expected setLevel() to leave developer-set flags untouched for ${type}`);
    assert.ok(!user.flags.includes("modified"), `Expected setLevel() to not introduce a "modified" flag for ${type}`);

    await xp.reset(userId, guildId, false, "FlagUser");
    user = await xp.fetch(userId, guildId, "FlagUser");
    assert.deepStrictEqual([...(user.flags || [])].sort(), [...customFlags].sort(), `Expected reset() to leave developer-set flags untouched for ${type}, since flags are not xp/level state`);

    await clearGuild(guildId);
}

async function testSetFlagsUndefinedNormalization(type) {
    const guildId = `${type}-undefined-flags-guild`;
    const userId = `${type}-undefined-flags-user`;

    await connectAdapter(type);
    await clearGuild(guildId);

    await xp.setFlags(userId, guildId, ["illegal"], "FlagUser");
    let user = await xp.fetch(userId, guildId, "FlagUser");
    assert.deepStrictEqual([...(user.flags || [])].sort(), ["illegal"], `Expected explicit flags to persist for ${type}`);

    await xp.setFlags(userId, guildId, undefined, "FlagUser");
    user = await xp.fetch(userId, guildId, "FlagUser");
    assert.deepStrictEqual(user.flags, [], `Expected setFlags(undefined) to normalize to empty array for ${type}`);

    const rawUser = await xp.Database.findOne({ collection: "simply-xps", data: { guild: guildId, user: userId } });
    assert.ok(rawUser, `Expected user row to exist after setFlags(undefined) for ${type}`);
    assert.deepStrictEqual(rawUser.flags, [], `Expected adapter row flags to be [] after setFlags(undefined) for ${type}`);

    await clearGuild(guildId);
}

async function testAdditiveEventListeners(type) {
    const guildId = `${type}-events-guild`;
    const userId = `${type}-events-user`;

    await connectAdapter(type);
    await clearGuild(guildId);

    let pluginSeen = 0;
    let ownerSeen = 0;

    // A plugin subscribes first, then the bot owner registers its own handler.
    // Before XpEvents.add() existed, the second call silently destroyed the first.
    const unsubscribe = xp.XpEvents.add({ levelUp: () => { pluginSeen++; } });
    xp.XpEvents.on({ levelUp: () => { ownerSeen++; } });

    await xp.setXP(userId, guildId, 0, "EventUser");
    await xp.setXP(userId, guildId, 900, "EventUser");

    assert.ok(pluginSeen > 0, `Expected XpEvents.add() listener to fire alongside on() for ${type}`);
    assert.ok(ownerSeen > 0, `Expected XpEvents.on() listener to keep firing for ${type}`);

    const pluginSeenBeforeUnsubscribe = pluginSeen;
    unsubscribe();

    await xp.setXP(userId, guildId, 0, "EventUser");
    await xp.setXP(userId, guildId, 2500, "EventUser");

    assert.strictEqual(pluginSeen, pluginSeenBeforeUnsubscribe, `Expected unsubscribe() to stop the added listener for ${type}`);
    assert.ok(ownerSeen > 1, `Expected on() listener to survive an unrelated unsubscribe for ${type}`);

    xp.XpEvents.on({});
    await clearGuild(guildId);
}

async function testPluginNamespaceStore(type) {
    await connectAdapter(type);

    const store = xp.Database.namespace("regression-plugin");
    const other = xp.Database.namespace("regression-plugin-other");
    await store.clear();
    await other.clear();

    assert.strictEqual(await store.get("missing"), null, `Expected unset keys to read back as null for ${type}`);

    await store.set("cooldown", { until: 42, hits: 2 });
    assert.deepStrictEqual(await store.get("cooldown"), { until: 42, hits: 2 }, `Expected namespace store to round-trip objects for ${type}`);

    await store.set("count", 7);
    assert.deepStrictEqual((await store.keys()).sort(), ["cooldown", "count"], `Expected keys() to list namespace keys for ${type}`);

    await other.set("cooldown", "different");
    assert.deepStrictEqual(await store.get("cooldown"), { until: 42, hits: 2 }, `Expected namespaces to stay isolated for ${type}`);

    assert.strictEqual(await store.delete("count"), true, `Expected delete() to report removal for ${type}`);
    assert.strictEqual(await store.get("count"), null, `Expected deleted keys to read back as null for ${type}`);
    assert.strictEqual(await store.clear(), 1, `Expected clear() to report how many keys were removed for ${type}`);

    await other.clear();
}

async function testPluginDestroyLifecycle() {
    await connectAdapter("sqlite");

    let initialized = false;
    let destroyed = false;

    await xp.registerPlugins([{
        name: "regression-lifecycle-plugin",
        requiredVersions: ["2"],
        initialize: () => { initialized = true; },
        destroy: () => { destroyed = true; }
    }]);

    assert.strictEqual(initialized, true, "Expected registerPlugins() to run initialize()");
    assert.strictEqual(destroyed, false, "Expected destroy() not to run during registration");

    await xp.unregisterPlugins(["regression-lifecycle-plugin"]);
    assert.strictEqual(destroyed, true, "Expected unregisterPlugins() to run the plugin's destroy()");

    // Unregistering twice must not throw, and plugins without destroy() are fine.
    await xp.unregisterPlugins(["regression-lifecycle-plugin"]);
    await xp.registerPlugins([{ name: "regression-no-destroy", requiredVersions: ["2"], initialize: () => { } }]);
    await xp.unregisterPlugins();
}

const failWith = async () => { throw new Error("boom"); };

async function withBrokenDatabaseMethod(name, operation) {
    const original = xp.Database[name];
    xp.Database[name] = failWith;
    try {
        await assert.rejects(operation(), /boom/, `Expected the call to propagate the underlying ${name}() failure instead of swallowing it`);
    } finally {
        xp.Database[name] = original;
    }
}

async function testLevelRolesPropagatesDatabaseErrors() {
    const guildId = "levelroles-error-guild";

    await connectAdapter("sqlite");
    await xp.Database.deleteMany({ collection: "simply-xp-levelroles", data: { guild: guildId } });

    // Set up a level with two roles so delete() can exercise both its "remove everything"
    // (deleteOne) and "remove some roles" (updateOne) branches.
    await xp.LevelRoles.add(guildId, { level: 5, roles: ["role-a", "role-b"] });

    await withBrokenDatabaseMethod("updateOne", () => xp.LevelRoles.add(guildId, { level: 6, roles: ["role-c"] }));
    await withBrokenDatabaseMethod("updateOne", () => xp.LevelRoles.set(guildId, { level: 5, roles: ["role-d"] }));
    await withBrokenDatabaseMethod("updateOne", () => xp.LevelRoles.delete(guildId, { level: 5, roles: ["role-a"] }));
    await withBrokenDatabaseMethod("deleteOne", () => xp.LevelRoles.delete(guildId, { level: 5 }));
    await withBrokenDatabaseMethod("deleteMany", () => xp.LevelRoles.deleteAll(guildId));

    await xp.Database.deleteMany({ collection: "simply-xp-levelroles", data: { guild: guildId } });
}

async function testLevelRolesReportsWhetherSomethingWasDeleted() {
    const guildId = "levelroles-deletion-report-guild";

    await connectAdapter("sqlite");
    await xp.Database.deleteMany({ collection: "simply-xp-levelroles", data: { guild: guildId } });

    assert.strictEqual(await xp.LevelRoles.deleteAll(guildId), false, "Expected deleteAll() to report false when the guild had no level roles");
    assert.strictEqual(await xp.LevelRoles.delete(guildId, { level: 1 }), false, "Expected delete() to report false for a level that does not exist");

    assert.strictEqual(await xp.LevelRoles.add(guildId, { level: 1, roles: ["role-a"] }), true, "Expected add() to report true on success");
    assert.strictEqual(await xp.LevelRoles.deleteAll(guildId), true, "Expected deleteAll() to report true when it actually removed something");
    assert.strictEqual(await xp.LevelRoles.deleteAll(guildId), false, "Expected a second deleteAll() with nothing left to report false");

    await xp.Database.deleteMany({ collection: "simply-xp-levelroles", data: { guild: guildId } });
}

async function runParityScenario(type) {
    const guildId = "parity-shared-guild";

    await connectAdapter(type);
    await clearGuild(guildId);

    await xp.setFlags("user-a", guildId, ["illegal"], "Alpha");
    await xp.addXP("user-a", guildId, 25, "Alpha");
    await xp.setLevel("user-b", guildId, 3, "Beta");
    await xp.addXP("user-b", guildId, 75, "Beta");
    await xp.setXP("user-a", guildId, 90, "Alpha");
    await xp.setLevel("user-a", guildId, 4, "Alpha");
    await xp.reset("user-a", guildId, false, "Alpha");
    await xp.addXP("user-a", guildId, 16, "Alpha");
    await xp.setXP("user-c", guildId, 100, "Charlie");
    await xp.setXP("user-d", guildId, 100, "Delta");

    const state = {
        leaderboard: normalizeLeaderboard(await xp.leaderboard(guildId)),
        userA: normalizeUser(await xp.fetch("user-a", guildId, "Alpha")),
        userB: normalizeUser(await xp.fetch("user-b", guildId, "Beta"))
    };

    await clearGuild(guildId);
    return state;
}

async function testAdapterParity() {
    const mongoUri = loadMongoUri();
    if (!mongoUri) {
        return false;
    }

    const sqliteState = await runParityScenario("sqlite");
    const mongoState = await runParityScenario("mongodb");

    assert.deepStrictEqual(mongoState, sqliteState, "Expected MongoDB and SQLite to return identical results for the same operation sequence");
    return true;
}

async function run() {
    const suiteStartedAt = performance.now();

    await runGroup("Core exports and adapter errors", async () => {
        await runCase("removes deprecated top-level aliases", testDeprecatedAliasesRemoved);
        await runCase("ships the bundled default font in lib/", testBundledFontIsPackaged);
        await runCase("throws catchable fatal on missing adapter", testMissingAdapterThrowsCatchableFatal);
    });

    await runGroup("Events and helper behavior", async () => {
        await runCase("awaits async level callbacks", testAsyncCallbacksAreAwaited);
        await runCase("threads mongodb dbOptions.name through internals", testMongoDbNameThreadingViaUpdateOptions);
        await runCase("handles https helper endpoint override and timeout cleanup", testHttpsHelperBehavior);
    });

    await runGroup("Migration coverage", async () => {
        await runCase("migrates sqlite level roles gid->guild column", testSqliteGuildColumnMigration);
        await runCase("migrates mongodb fromDB path into sqlite", testMigrateFromDbMongoPathIntoSqlite);
    });

    await runGroup("Plugin extension points", async () => {
        await runCase("supports additive XpEvents.add() listeners", () => testAdditiveEventListeners("sqlite"));
        await runCase("gives plugins isolated namespace storage", () => testPluginNamespaceStore("sqlite"));
        await runCase("runs Plugin.destroy() on unregisterPlugins()", testPluginDestroyLifecycle);
    });

    await runGroup("LevelRoles error handling", async () => {
        await runCase("propagates database errors instead of returning false", testLevelRolesPropagatesDatabaseErrors);
        await runCase("reports whether deleteAll()/delete() actually deleted something", testLevelRolesReportsWhetherSomethingWasDeleted);
    });

    await runGroup("SQLite adapter behavior", async () => {
        await runCase("preserves concurrent write correctness", () => testConcurrentWrites("sqlite"));
        await runCase("keeps create() idempotent on an existing user", () => testCreateIsIdempotentOnExistingUser("sqlite"));
        await runCase("keeps tie ranking parity", () => testTieRankingParity("sqlite"));
        await runCase("bulk syncs xp_rate and levels", () => testXpRateBulkSync("sqlite"));
        await runCase("keeps developer-set flags opaque across all XP/level mutations", () => testFlagsRemainOpaqueAcrossMutations("sqlite"));
        await runCase("normalizes setFlags(undefined) to []", () => testSetFlagsUndefinedNormalization("sqlite"));
    });

    if (loadMongoUri()) {
        await runGroup("MongoDB adapter behavior", async () => {
            await runCase("preserves concurrent write correctness", () => testConcurrentWrites("mongodb"));
            await runCase("keeps create() idempotent on an existing user", () => testCreateIsIdempotentOnExistingUser("mongodb"));
            await runCase("keeps tie ranking parity", () => testTieRankingParity("mongodb"));
            await runCase("bulk syncs xp_rate and levels", () => testXpRateBulkSync("mongodb"));
            await runCase("keeps developer-set flags opaque across all XP/level mutations", () => testFlagsRemainOpaqueAcrossMutations("mongodb"));
            await runCase("normalizes setFlags(undefined) to []", () => testSetFlagsUndefinedNormalization("mongodb"));
            await runCase("supports additive XpEvents.add() listeners", () => testAdditiveEventListeners("mongodb"));
            await runCase("gives plugins isolated namespace storage", () => testPluginNamespaceStore("mongodb"));
        });

        await runCase("keeps sqlite and mongodb parity for same scenario", async () => {
            const parityCovered = await testAdapterParity();
            assert.strictEqual(parityCovered, true, "Expected adapter parity test to run when Mongo URI is available");
        });
    } else {
        printSkip("MongoDB adapter behavior");
        printSkip("cross-adapter parity scenario");
    }

    console.log(`✔ regression.test.cjs (${formatDuration(performance.now() - suiteStartedAt)})`);
    console.log("[REGRESSION] All regression tests passed.");
    process.exit(0);
}

run().catch((error) => {
    console.error("[REGRESSION] Failure:", error);
    process.exit(1);
});
