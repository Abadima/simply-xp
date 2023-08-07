# VERSION 2@DEV CHANGELOGS

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
- `addLevel(), addXP(), setLevel(), setXP()` now has a `username` parameter, to automatically create the user if it doesn't exist.
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