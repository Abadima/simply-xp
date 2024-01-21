# VERSION 2 CHANGELOGS

## [BETA 0 FIX 0](https://github.com/Abadima/simply-xp/releases/tag/v2.0.0-beta.0-fix.0)

### Additions

- Add `fallbackFont` option to `charts()`, `compareCard()`, `leaderboardCard()` and `rankCard()`, to use a fallback font, as part of
  our bug fix.

### Improvements

- `rank()` gets minor code improvements.

### Bug Fixes

- Fix typings for `updateOptions()`
- Fix `compareCard()` and `rankCard()` unnecessary username filter, and inconsistencies.
- Swapped fonts from CDN to local, preventing future crashes.

### Improvements

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
- Fix `simply-xps-levelroles` not having `timestamp` property in SQLite & MongoDB
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