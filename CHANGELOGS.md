# VERSION 2

## [V2.0.1](https://github.com/Abadima/simply-xp/releases/tag/v2.0.1) - V2 PATCH

### ⚒️ Bug Fixes

- Fix `addXP()`, `removeXP()`, `setXP()`, `addLevel()`, `removeLevel()`, `setLevel()`, and `reset()` auto-managing a `"modified"` flag on user records. Flags are developer-defined data; simply-xp no longer adds, removes, or interprets any flag value during XP/level operations.
- Fix `Database.findOne()`, `find()`, `findAll()`, and `updateOne()` declaring variables directly inside `switch`/`case` blocks (found by CodeFactor).

## [V2.0.0](https://github.com/Abadima/simply-xp/releases/tag/v2.0.0) - V2 STABLE RELEASE

### ✅ Additions

- `Database.find()` and `Database.findAll()` now support an optional `limit` parameter for top-N reads.
- `leaderboard()` now uses adapter-level limiting when `guildId` and `limit` are provided.
- Connect-time index enforcement now includes unique user records (`guild + user`), unique level-role records (`guild + level`), and leaderboard ranking indexes for guild and global XP ordering.
- Add `XpEvents.add()`. Register event callbacks without replacing existing ones, and get back a function that removes them again. `XpEvents.on()` still holds a single callback object, so plugins (and anything that has to coexist with other listeners) should use `add()`.
- Add `Database.namespace()` (a namespaced key/value store: `get`, `set`, `delete`, `keys`, `clear`) so plugins can persist their own data on both MongoDB and SQLite without touching `xp.database` or the simply-xp tables. Storage is created lazily on first write, so plugins that never store anything cost nothing.
- Add optional `Plugin.destroy()` and `unregisterPlugins()`. Plugins can now clean up timers, handles, and listeners. Failures stay isolated per plugin, exactly like registration.
- Add `Database.countUsersWithMoreXp()`, the shared leaderboard position lookup used internally by `fetch()` and `rankCard()`.

### ⭐ Improvements

- Bump `@napi-rs/canvas` to V1.
- **`better-sqlite3` V13 is now supported and tested.** The new supported range is V7 through V13.
- The supported version ranges for `better-sqlite3` and `mongodb` are now defined once, in `connect.ts`, and read by `Migrate.ts` and `utilities.ts` instead of being duplicated as separate hardcoded numbers in each file.
- Database adapters (`better-sqlite3`, `mongodb`) are now optional peer dependencies with explicit runtime detection.
- Minimum supported Node.js lowered from `>=15.5.0` to `>=14.0.0` for simply-xp itself. Note that the adapters set their own version requirements. On older runtimes, install an older adapter major (see the README).
- `clean({ db: true })` now performs awaited set-based cleanup and warns on cleanup failures instead of failing silently.
- Card and chart renderers now always execute cleanup in `finally` paths, guaranteeing cache release on both success and error.
- `fetch()` and `rankCard()` position lookups now use adapter-specific count queries instead of loading full guild user arrays into memory.
- `syncUsersXpRate()` now performs set-based updates filtered by `xp_rate` mismatch instead of per-user read/write loops.
- `leaderboard()` now assigns `position` directly onto each row instead of spreading it into a new object per row (present since `2.0.0-beta.4`), found by Oxlint (`no-map-spread`).

### 🔀 Changes

- `registerPlugins()` now returns `Promise<void>` and should be awaited.
- `updateOptions()` now returns `Promise<void>` and should be awaited.
- `registerPlugins()` version compatibility matching for `requiredVersions` is now deterministic.
- Public `Plugin.initialize` typing now explicitly accepts both synchronous and asynchronous initializers (`void | Promise<void>`).
- Public `LevelRole` typing now reflects that `roles` may be omitted when using `LevelRoles.delete()` to remove a full level entry.
- Missing adapter detection now throws a catchable `XpFatal` with code `SX_ADAPTER_MISSING`.
- Leaderboard tie ranking is now XP-only:
  - Adapter-level sorting no longer applies a user-ID tiebreak.
  - `leaderboard()` now emits shared positions for equal XP, matching `fetch()`.
- `addXP()` / `removeXP()` docs now explicitly describe intentional negative-delta behavior.
- Build/publish scripts now compile (`tsc`) before minifying and publishing, reducing stale publish artifact risk.
- **Linting moved from ESLint to [Oxlint](https://oxc.rs/docs/guide/usage/linter).**. Run it with `npm run lint` (or `npm run lint:fix`).
- A small number of rules are switched off deliberately, each with the reason recorded in `.oxlintrc.json` (e.g. `unicorn/no-array-sort` suggests `Array#toSorted()`, which needs Node 20 and would break our Node 14 floor).
- Added a CI workflow (`.github/workflows/ci.yml`) that runs Oxlint, the typecheck, the build, and the regression suite on Node 22.
- Removed the `module` field from `package.json`. It pointed at `lib/xp.js`, which is CommonJS, but bundlers read `module` as an ESM entry point. They now correctly fall back to `main`.

### ⚒️ Bug Fixes

- Fix `https()` not preserving query strings and non-standard ports, not enforcing total request timeout, and not returning immediately on unexpected status codes.
- Fix adapter version detection falsely reporting installed `better-sqlite3` / `mongodb` packages as missing on runtimes that require import attributes for JSON module loading.
- Fix `connect()` not remediating duplicate user and level-role records before uniqueness enforcement. Now remediates first and fails fast if uniqueness still cannot be guaranteed.
- Fix `connect()` and `updateOptions()` not rejecting invalid `xp_rate` values (`<= 0`, non-finite), and ignoring explicit `notify: false`.
- Fix `connect()` default database fallback not applying correctly when using normalized `options.type`, and not consistently seeding `xp.dbName` for MongoDB.
- Fix SQLite `connect()` error handling swallowing non-coded setup errors, now always rethrows with full `XpFatal` context.
- Fix `addXP()` / `removeXP()` object validation rejecting valid zero values.
- Fix `addXP()`, `removeXP()`, `setXP()`, `addLevel()`, and `removeLevel()` using read/modify/write flows vulnerable to race conditions.
- Fix MongoDB add/remove mutation event deltas by using atomic pre-state snapshots (`findOneAndUpdate` with `returnDocument: "before"`) for delta paths.
- Fix `setXP()` not consistently recalculating level from resulting XP and not awaiting `levelUp` / `levelDown` callbacks.
- Fix `fetch()` auto-create flow calling `create()` with incorrect argument order.
- Fix `fetch()` triggering hidden cleanup side-effects.
- Fix `reset()` risking username-based targeting mismatches, now updates and deletes by stable `guild + user` identity.
- Fix SQLite JSON parsing for `flags` and `levelrole` fields not handling malformed payloads gracefully.
- Fix SQLite level-role schema compatibility by migrating legacy `gid` column usage to `guild` and normalizing parser fallback.
- Fix `LevelRoles` SQLite and MongoDB query paths not consistently matching records by `levelrole.level`, causing update and delete misses.
- Fix `LevelRoles.add()`, `delete()`, `set()`, and `deleteAll()` returning errors with `false` instead of throwing `XpFatal` like the rest of the public API. `deleteAll()` and the "remove some roles" path of `delete()` also now report `false` when nothing was actually deleted.
- Fix `create()` throwing on MongoDB, but not SQLite, when called for a user that already exists.
- Fix `compareCard()` auto-create guard validating `user2` data against `user1`.
- Fix `rankCard()`, `charts()`, and `leaderboardCard()` not guarding math and fallback paths for zero or invalid totals and missing guild images.
- Fix `Migrate.roleSetup()` SQLite flow using schema-rebuild behavior instead of transactional row migration.
- Fix `registerPlugins()` surfacing unhandled rejections on async failures, now routing through `XpLog`.
- Fix `setLevel()`, `addLevel()`, and `removeLevel()` not firing `levelUp` / `levelDown` events.
- Fix `updateOptions()` MongoDB policy drift by enforcing the same minimum version floor as `connect()` (v4+).
- Fix the bundled `Baloo2-Regular.woff2` fallback font not being produced by the build.
- Fix unnecessary escape sequences in the `SX_ADAPTER_MISSING` message templates, and an unused catch binding in `updateOptions()` (both found by Oxlint).

### ❌ Removals

- Removed `auto_clean` option from `connect()`, `updateOptions()`, and the `xp` runtime surface (`XPClient`).
- Removed support for MongoDB v3 (minimum supported version is now v4).
- Removed deprecated top-level compatibility aliases, use `Database` and `Migrate` directly.
- Removed unsupported `Plugin.functions` from the public plugin contract.
- Removed ESLint entirely. Oxlint replaces it (see Changes).

## [BETA 4](https://github.com/Abadima/simply-xp/releases/tag/v2.0.0-beta.4) — V2 RELEASE CANDIDATE

### Additions

- Add `dbOptions.name` to `updateOptions()` — MongoDB only: specify the database name explicitly instead of relying on the default derived from the connection URI. All internal MongoDB calls (`Database`, `connect`, `Migrate`) now respect this setting via `xp.dbName`.

### Improvements

- Bump `@napi-rs/canvas` to V0.1.96.
- **`compareCard()`** redesigned: per-user names above avatars, tug-of-war XP bar (proportional fill, level diff inside), per-user XP shown below level label.
- Avatar ring rendering improved across `rankCard()` and `compareCard()`: image drawn first, stroke ring overlaid on top.
- Text strokes changed to translucent (`rgba(0,0,0,0.5)`, `lineJoin="round"`) across all cards — shadow-like instead of hard black.
- Text stroke thickness reduced (large labels: 7px, standard: 5px).
- `rankCard()` and `fetch()` position calculation: `filter()` count instead of `sort()` + `findIndex()`.
- `fetch()`: static imports for `Database` and `create` (was dynamic per-call).
- `create()`: static import for `Database` (was dynamic per-call).
- `addXP()`: `levelUp`/`levelDown` callbacks are now `await`ed.
- All `XpEventCallback` properties are now optional; return type supports `Promise<void>`.
- `description` on all card/chart return values is now contextual (includes username, level, guild, etc.).

### Bug Fixes

- Fix operator-precedence bug in `compareCard()` `cardBoxColor` assignment.
- Fix redundant ternary in `rankCard()` modern stroke style.
- Remove extension checks on avatar URLs in `compareCard()` — any valid image URL is accepted.

## [BETA 3](https://github.com/Abadima/simply-xp/releases/tag/v2.0.0-beta.3)

### ⚠️ Breaking Changes

- Complete overhaul of all `roleSetup` functionality. Now it's `LevelRoles`. Please refer to the updated [Documentation](https://simplyxp.js.org/docs/Classes/LevelRoles) for full details.
  - > **⚠️ NOTE:** As a result of this change, all old level roles are no longer supported, please use `migrate.roleSetup()` to migrate your old level roles to the new system.

### 🔥 Deprecations

- Class `migrate` will be removed in the near future. Please use the new `Migrate` class instead.
- Class `db` will be removed in the near future. Please use the new `Database` class instead.

### Additions

- Add `Migrate.roleSetup()` function, to migrate old level roles to the new `LevelRoles` system.
- Add per-database `schemaVersion` metadata for SQLite and MongoDB (v1 for older DBs, v2 for new/migrated DBs).

### Improvements

- Bump `@napi-rs/canvas` to V0.1.88.
- Update `connect.ts` for SQLite:
  - Add `createdAt` columns to `simply-xps` and `simply-xp-levelroles` tables.
  - Rename `lvlrole` column to `levelRole` in `simply-xp-levelroles` table.
- Update `Database.ts`:
  - Add `createdAt` to `UserResult` and `LevelRoleResult`.
  - Rename `lvlrole` to `levelRole` in `LevelRoleResult`.
  - Improve `updateOne()` for SQLite (+upsert support).
  - Fix documentation links in JSDoc.
- Update `leaderboard.ts`:
  - Improve sorting efficiency, especially for duplicate users and large datasets.
- Update `registerPlugins()` to support:
  - Major (`2`), major.minor (`2.0`), and major.minor.patch (`2.0.0`) version specifications.
  - Pre-release versions (e.g., `2.0.0-dev.1`).
  - Improved registration logic.

## [BETA 2](https://github.com/Abadima/simply-xp/releases/tag/v2.0.0-beta.2)

### Improvements

- Add `mongodb` V7 Support
- Bump `@napi-rs/canvas` to V0.1.83.
- Add `better-sqlite3` V10 & V11 Support
- Update `rankCard()` and `compareCard()` to favor strokes over shadows for better system performance.
- `checkPackageVersion()` (`substring()` => `split()`) and (`Promise<boolean>` => `Promise<"too_low" | "ok" | "too_high">`)
  - > **⚠️ NOTE:** As a result of this change, now the process won't exit when the package version is too high, instead it will leave a warning in the console, call it "experimental support".
- Update themes in `charts()` for better contrast and color differentiation.
- Optimize `charts()` drawing code for better efficiency.
- Add `light` and `pink` themes to `charts()`.

### Bug Fixes

- Fix `leaderboardCard()` not using user's preferred even/odd colours.

## [BETA 1](https://github.com/Abadima/simply-xp/releases/tag/v2.0.0-beta.1)

### Additions

- Add `setFlags()` function, to flag users in the database, useful for level tampering, annotating users, etc.
- Add `flags` property to `SQLite` and `MongoDB` databases, to store user flags.

### Improvements

- `db.updateOne()` will now throw better error when not enough parameters are provided. (SQLite)
- Readability in `db` functions.

### Bug Fixes

- Fixed a future bug where some `db` functions would return `null` instead of actual data. (MongoDB)

## [BETA 0 FIX 1](https://github.com/Abadima/simply-xp/releases/tag/v2.0.0-beta.0-fix.1)

### ⚠️ Breaking Changes

- `db.find()` now takes new parameters, `(collection, guildId)` for better syntax.

### Bug Fixes

- Fix `fetch()` rare error when user doesn't exist, and `auto_create` is true.
- Fix `roleSetup.list()` not returning roles when using MongoDB (Thanks itz_hyp3r on Discord for the report)

## [BETA 0 FIX 0](https://github.com/Abadima/simply-xp/releases/tag/v2.0.0-beta.0-fix.0)

### Additions

- Add `fallbackFont` option to `charts()`, `compareCard()`, `leaderboardCard()` and `rankCard()`, to use a fallback font, as part of
  our bug fix.

### Bug Fixes

- Fix typings for `updateOptions()`
- Fix `compareCard()` and `rankCard()` unnecessary username filter, and inconsistencies.
- Swapped fonts from CDN to local, preventing future crashes.

### Improvements

- `rank()` gets minor code improvements.
- Remove URL ending checks (`comapreCard()` and `rankCard()`), to allow for better image/gif support, while still
  elegantly handling errors.

## [🎉 BETA 0](https://github.com/Abadima/simply-xp/releases/tag/v2.0.0-beta.0)

### Additions

- Added `clean()` to help reduce reduce RAM usage, and lower database usage.
- Added `db.findAll()` for fetching all documents in a collection, without any filters.
- Added `https()` Function, to make HTTP requests.
- Added `lastUpdated` property to `UserResult`, this might be useful for some people.
- Added `leaderboard()` option to not include guildId, allowing for global leaderboards.
- Added `registerPlugins()` function, now you can make and use plugins to make `simply-xp` even more powerful.
- Added `removeLevel()` and `removeXP()` functions, to remove XP and Levels from a user.
- Added `roleSetup.list()` for listing all roles in a guild.
- Added `roleSetup.getRoles()` for getting user's level roles in a guild, has options.
- Added `voice_time` and `voice_xp` for SQLite, allowing for a future `@simply-xp/voice` package.
- Added `xp_rate` option for `connect()` and `updateOptions()` functions, to set XP rate globally.
- Added `xp_rate` as a database value, to update XP rates for all users upon xp_rate change.
- Added `XpEvents` class, to handle events instead of `console.log` (READ DOCS).
- More `leaderboardCard()` customization options (Suggested by notquarkhadron on Discord)
- Moved fonts to CDNs, to reduce package size.

### ⚠️ Breaking Changes

- `ConnectionOptions` and `NewClientOptions` replaces `auto_purge` with `auto_clean`.
- `addXP()`, `removeXP()`, `setXP()` replaces `hasLevelledUp` with `levelDifference`, returning the difference in
  levels,
  now always returns `number`.

### Bug Fixes

- Fix `charts()` displaying bar funny when a user has infinity XP.
- Fix `convertFrom()` returning `NaN` when negative number is provided, now will return 0 by default.
- (Hopefully) Fix `undefined` error when using `add` and `set` functions sometimes.
- Fix `LevelRoleResult` returning `lvlrole` as string, now returns `object` as intended.
- Fix `rankCard()` visual bug when user just levelled up.
- Fix broken `JSDocs` documentation links.

### Improvements

- Both `rankCard()` and `compareCard()` have visual & efficiency improvements.
- `hasLevelledUp` now returns new level number if user levelled up, instead of `true`.
- `leaderboardCard()` no longer requires `members` when including Guild details, and adjusted default colours.
- `leaderboardCard()` replaces `font` with `primaryFont` and `secondaryFont`, separating title from rest of the card.
- Added method to clear canvas cache, enable by setting `auto_clean` to `true` in `connect()`, or `updateOptions()`.
- If `username` is specified in `addXP()`, `addLevel()`, `setLevel()`, it will update the user's username.
- Replaced `Baloo` font to re-add support for symbols, unfortunately this means increased package size.
- `charts()` and `leaderboardCard()` have attempted RAM usage improvements.
- Downgraded `@napi-rs/canvas`, as a temporary fix for RAM
  leaks. [Issue #716](https://github.com/Brooooooklyn/canvas/issues/716)
- `charts()` minor code improvements.
- Made changes to `XpLog()` system.
- Add support for `MongoDB` V3.

### ❌ Removals

- `rank()` is removed, use `rankCard()` instead.

## [DEV 5 FIX 0](https://github.com/Abadima/simply-xp/releases/tag/v2.0.0-dev.5-fix.0)

### ⚠️ Breaking Changes

- `roleSetup()` now takes `role` instead of `roles` again, to make migration from V1 less painful

### Bug Fixes

- Complete overhaul of `simply-xp-levelroles` in SQLite, making it actually functional
- Fix `simply-xp-levelroles` not having `timestamp` property in SQLite & MongoDB
- Fix `roleSetup.add()` not actually returning `true/false`

## [DEV 5](https://github.com/Abadima/simply-xp/releases/tag/v2.0.0-dev.5)

### Additions

- Added `better-sqlite3` V9 Support
- Added `compareCard()` function, to compare two users.
- `db.deleteMany()` is now added, to make deleting multiple users easier.
- `rankCard()` now supports **Modern Design**, you can still override by passing `legacy: true` in options.

### Changes

- `connect()` will now install `mongodb v6` by default, versions down to `v4` are still supported.

### Bug Fixes

- Fix `charts()` handling invalid `type` & `theme` parameters.
- Missing `await` in `migrate.fromDB()` function.
- SQLite deleting username on `updateOne()`.

### Improvements

- Remove duplicate code in `charts()`.
- Updated colours in `charts()` themes, to make them more accurate and easier to differentiate.
- `leaderboard()` removes loop, and replaces with an `Asyncronous` method to improve performance.
- Tweaked `checkPackageVersion()`, which also updates `migrate` class, and `updateOptions()` function.
- Optimized font file (again), significantly lowers package size.
- Update `JSDocs` to feature our updated documentation urls.

## [DEV 4](https://github.com/Abadima/simply-xp/releases/tag/v2.0.0-dev.4)

### Additions

- `charts()` is now added, starting with `bar`, `doughnut` and `pie` types, and many themes to choose from.
- `migrate.fromDB()` now supports migrating from SQLite to MongoDB.

### Bug Fixes

- Fix `db.createOne()` not returning created user (MongoDB), this should fix multiple functions not working properly.
- Fix `db.addXP()` throwing unnecessary error when checking if new user is considered levelled up.
- `rankCard()` and `leaderboardCard()` now throws better error when image(s) provided can't be loaded.

### Improvements

- Optimized font file, lowers package size (~57.31%)
- Updated JSDocs to improve accuracy.

## [DEV 3 FIX 2](https://github.com/Abadima/simply-xp/releases/tag/v2.0.0-dev.3)

### Bug Fixes

- Fix `rankCard()` creating users with incorrect parameters.

## [DEV 3 FIX 1](https://github.com/Abadima/simply-xp/releases/tag/v2.0.0-dev.3)

### Bug Fixes

- Attempt fix `migrate.discord_xp()` not properly migrating users.
- Fix changelog links for [DEV 3] release

## [DEV 3](https://github.com/Abadima/simply-xp/releases/tag/v2.0.0-dev.3)

### Additions

- Added `db.getCollection()` feature, useful for custom database implementations.
- Implemented `migrate.fromDB()`, from MongoDB to SQLite. (Support for SQLite to MongoDB coming soon)

### ⚠️ Breaking Changes

- `migrate.discord_xp()` removes `dbUrl` parameter.
- `migrate.database()` => `migrate.fromDB()`
- `reset()` switches `username` and `erase` parameters around.

### Changes

- Overhauled `migrate.discord_xp()` function, should fix issues and remove unnecessary requirements.

### Bug Fixes

- Fix `reset()` not properly resetting users.

## [DEV 2 FIX 0](https://github.com/Abadima/simply-xp/releases/tag/v2.0.0-dev.2)

### Bug Fixes

- Fix SQLite Issues (`updateOne()`, `createOne()`), "Collection Mismatch" error, and `name` not being added on
  create/update.
- Fix `convertFrom()`, `setLevel()`, `setXP()`, `addLevel()`, `addXP()` throwing error when "0" is passed as value

## [DEV 2](https://github.com/Abadima/simply-xp/releases/tag/v2.0.0-dev.2)

### Additions

- Added `MongoDB` V4 Support
- `setXP()` and `addXP()` now also return `hasLevelledUp` property

### ⚠️ Breaking Changes

- `convert(type, value)` => `convertFrom(value, type)`

### Changes

- Updated JSDocs, changed some types to interfaces.
- Optimized font file, lowers package size (~32.12%)

## [DEV 1](https://github.com/Abadima/simply-xp/releases/tag/v2.0.0-dev.1)

### Additions

- `updateOptions()` function
- Added `MongoDB` V4 Support

### ⚠️ Breaking Changes

- `create()` swapped `userId` with `guildId` to avoid future confusions.
- `reset()` Updated Parameters.

### Changes

- All `roleSetup` functions now create & return `timestamp`, useful for sorting by creation date.
- `fetch()` has a new `username` parameter, to automatically create the user if it doesn't exist.
- `connect()` now accepts `auto_create`, All functions can create the user if it doesn't exist, avoiding errors.
- Updated JSDocs, changed some types to interfaces.
- `addLevel(), addXP(), setLevel(), setXP()` now has a `username` parameter, to automatically create the user if it
  doesn't exist.
- `rank()` will now auto create the user if it doesn't exist if `auto_create` is set to `true`.

## [DEV 0 FIX 2](https://github.com/Abadima/simply-xp/releases/tag/v2.0.0-dev.0)

### ✅ V2 Additions

- Added support for `SQLite` database
- Added `debug` option for `connect()` function
- Added `db` class for extended database functionality
- Added `leaderboardCard()` function
- Added `coreFunctions()` function
- Added `migrate` class

### 🎉 V2 Changes 🎉

- Better Documentation
- Better Log Handling (`XpDebug`, `XpError`, `XpInfo`, `XpWarn`)
- Better Performance
- Better Code Quality (EsLint)
- Complete TypeScript Rewrite
- Deleted `chart.js` dependency
- `fetch()` now also returns `position`
- `roleSetup` functions now accept roleID arrays! `["role1", "role2", "role3"]`
- `reset()` function now accepts "erase" as an optional argument

### ⚠️ V2 Breaking Changes ⚠️

- `create()` Requires new arguments.
- `charts()` Requires new arguments.
- `rank()` is **deprecated**, use `rankCard()` instead.
- `rankCard()` Requires completely new arguments.
- `roleSetup()` functions loses `client` argument.

# VERSION 1

## [1.3.8](https://github.com/Abadima/simply-xp/commit/b52848a7dee22428aab7fdfc56cd9a0a063f82d4)

### ⭐ Improvements

- Refactor leaderboard and rank position calculation into a new utility for efficiency and code reuse.
- Add a compound index to the level model for improved leaderboard query performance.
- Improve leaderboard auto-purge logic and cleaned up code style.
- Refactor `rank()` image to scale background images properly, fixing stretching issues.

### 💎 Design Changes

- Replace `Baloo-Regular.ttf` to `Baloo2-Regular.woff2` for better performance and smaller size.

### ⬆️ Dependencies

- Bump `@napi-rs/canvas` from `v0.1.43` to `v0.1.88`.

## [1.3.7](https://github.com/Abadima/simply-xp/commit/8922663d894e39142ec5516d19a406d0e94765eb)

### ⚒️ Bug Fixes

- Fix leaderboard not properly showing users when some have left the server.

## [1.3.5](https://github.com/Abadima/simply-xp/commit/02958e9d991c7f58723a650a13b7a8d41ca116c2)

### ✅ Additions

- Add `eslint` to the
  project. ([#c567aa5](https://github.com/Abadima/simply-xp/commit/c567aa55829f84d808ef46e64abf50cd629d863a#diff-6884918dc8291219be508e05e28965b958c734def85324f3b53858ea4702090f))
- Add `auto_purge` option
  to `connect()` ([#02958e9](https://github.com/Abadima/simply-xp/commit/02958e9d991c7f58723a650a13b7a8d41ca116c2#diff-7aa4473ede4abd9ec099e87fec67fd57afafaf39e05d493ab4533acc38547eb8))

### ⚒️ Bug Fixes

- Fix `charts()` not properly reporting when user doesn't have `canvas`
  installed. ([#9cdaf7b](https://github.com/Abadima/simply-xp/commit/9cdaf7bacb4e7cd328fe3e1fef9487fcf5383858#diff-4b7e0d44140210d10ead1c1e4f5aa4dc6e889e8711c10ce2636afe6c98af8d0c))
- Fix `rank()` not buffering image
  as `image/webp`. ([#9cdaf7b](https://github.com/Abadima/simply-xp/commit/9cdaf7bacb4e7cd328fe3e1fef9487fcf5383858#diff-a5daabea44be64b61855cb928a433b98581d947c27563a257df28a29833f6119))
- Fix `leaderboard()` Position & Cache issues.

### ⬆️ Dependencies

- Bump `mongoose` from V6 to V7.
- Bump `@napi-rs/canvas` from v0.1.28 to v0.1.41.

### ⭐ Improvements

- Improved Code Quality.
- Improved Performance.

## [1.3.4](https://github.com/Abadima/simply-xp/commit/5a53925e4d3a75c419aa398394789716b8500761)

### ⚒️ Bug Fixes

- Fix `addLevel()` only adding 1 level.
- Fix `roleSetup.find()` returning only 1 Role ID.

### 💎 Design Changes

- Update UI of `rank()`, including a new default background.

## [1.3.2](https://github.com/Abadima/simply-xp/commit/c104afc015ee940caacbdd773df96a8c26b358ac)

### ⬆️ Dependencies

- Replace `canvas` with `@napi-rs/canvas` for better performance, and to fix `node-gyp` issues.

### ⭐ Improvements

- Update `rank()` to use `@napi-rs/canvas`.

## [1.3.0](https://github.com/Abadima/simply-xp/commit/c7731049a80f74488ef506f950b3d40ce2cfa09a)

### ⚒️ Bug Fixes

- Fix `position` not actually working
  in `charts()`. ([#72a1ac8](https://github.com/Abadima/simply-xp/commit/72a1ac8813e6f917a49848225c00a63c931d6592#diff-4b7e0d44140210d10ead1c1e4f5aa4dc6e889e8711c10ce2636afe6c98af8d0c))
- Fix `addLevel` not correcting XP, and not adding specified level.

### ⬆️ Dependencies

- Replace `chart.js-image` with `chart.js` to remove vulnerabilities & improve
  performance. ([#b57ad49](https://github.com/Abadima/simply-xp/commit/b57ad496a51248ac8a538c00ccfd3e0f66f53dbf#diff-7ae45ad102eab3b6d7e7896acd08c427a9b25b346470d7bc6507b6481575d519))

### ⭐ Improvements

- Eliminate `discord.js` functions from being used in the
  package. ([#72a1ac8](https://github.com/Abadima/simply-xp/commit/72a1ac8813e6f917a49848225c00a63c931d6592))

## [1.2.0](https://github.com/Abadima/simply-xp/commit/3ea40906a0b2c0d4506729a02dc11ca2803a57b8)

### ⚒️ Bug Fixes

- Fix `reset()` not saving user
  sometimes. ([#9ac31bc](https://github.com/Abadima/simply-xp/commit/9ac31bc2b31fd5bd9b6d67bf58566a21303eb830#diff-c7ef6e12bc4d8fa07f027dd46cc1704859cc97add590b4a9ea2dcef8da4a9b71))

### ⬆️ Dependencies

- Bump `chart.js-image` from v5 to v6

### ⭐ Improvements

- `rank()` Can now count to an
  undecillion! ([#9ac31bc](https://github.com/Abadima/simply-xp/commit/9ac31bc2b31fd5bd9b6d67bf58566a21303eb830#diff-a5daabea44be64b61855cb928a433b98581d947c27563a257df28a29833f6119))

---

> Looking for earlier versions? Refer to [GitHub Releases.](https://github.com/Abadima/simply-xp/commits/latest/)
