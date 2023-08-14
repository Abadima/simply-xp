# VERSION 2@DEV CHANGELOGS

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
- Optimized font file, lowers package size.

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