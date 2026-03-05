<p align="center">
  <img src="https://i.ibb.co/cCKJ9FS/simplyxp.png" width="320" height="125" alt="XP Logo">
</p>

<h2 align="center">We have levelling! - You handle the rest.</h2>
<h3 align="center">Made by Abadima</h3>

<br>

<div align="center">

[![Downloads](https://img.shields.io/npm/dt/simply-xp?style=for-the-badge)](https://www.npmjs.com/package/simply-xp)
[![Version](https://img.shields.io/npm/v/simply-xp.svg?style=for-the-badge)](https://www.npmjs.com/package/simply-xp)
[![CodeFactor](https://www.codefactor.io/repository/github/abadima/simply-xp/badge/pre-release?style=for-the-badge)](https://www.codefactor.io/repository/github/abadima/simply-xp/overview/pre-release)

[![Documentation](https://img.shields.io/badge/SimplyXP-Documentation-6b46d4?style=for-the-badge)](https://simplyxp.js.org/docs/next/intro/)
[![Support](https://img.shields.io/badge/Discord-Support-5865F2?style=for-the-badge&logo=discord)](https://discord.gg/hjhnjYJNHX)

</div>

---

> CREDITS TO [RAHULETTO](https://github.com/rahuletto) FOR SIMPLY-XP **VERSION 1**

---

<br>

## 🖥️ <b>[BETA] Installation</b>

```shell
npm install simply-xp@beta
```

```shell
pnpm install simply-xp@beta
```

```shell
yarn add simply-xp@beta
```

<br>

## ✅ V2 Additions

- Add `auto_create`, `auto_clean`, `debug`, and `xp_rate` options to `connect()`.
- Add `compareCard()`.
- Add `convertFrom()`.
- Add `db` class for extended database functionality.
- Add `https()` function.
- Add `leaderboardCard()`.
- Add `Migrate` class with `Migrate.roleSetup()` for migrating old level roles.
- Add `SQLite` support.
- Add `LevelRoles` system (replaces old `roleSetup` functionality).
- Add `registerPlugins()`.
- Add `removeLevel()` and `removeXP()`.
- Add `updateOptions()`.
- Add `xp_rate` support for unique level rates.
- Add `createdAt` property to `UserResult` and `LevelRoleResult`.
- Add `levelRole` column to `simply-xp-levelroles` table in SQLite.

## 🎉 V2 Changes

- All functions returning `UserResult` or `LevelRoleResult` now include `lastUpdated` and `createdAt` properties.
- `lvlrole` column renamed to `levelRole`.
- `connect()` now automatically creates missing `createdAt` and `levelRole` columns for SQLite tables.
- Improved `updateOne()` for SQLite with upsert support.
- Updated `registerPlugins()` to support major, minor, patch, and pre-release versions.
- Better performance and reduced RAM usage.
- Improved code quality (ESLint) and full TypeScript rewrite.
- Renewed logging system (`XpLog`).
- Reduced package size and new fonts.
- `addLevel()`, `addXP()`, `setLevel()`, `setXP()` now accept `username` to auto-create users if they don’t exist.
- `fetch()` now returns `position` and accepts `username`.
- `leaderboard()` supports global leaderboards by omitting `guildId`.
- `roleSetup` functions now replaced by `LevelRoles` class; old `roleSetup` arrays are migrated via `Migrate.roleSetup()`.

## ⚠️ V2 Breaking Changes

- Old `roleSetup` system removed; migrate to `LevelRoles`.
- `lvlRole()` removed; use `LevelRoles` or `roleSetup.getRoles()`.
- `create()` now requires `username`.
- `charts()` arguments revamped.
- `rank()` removed; use `rankCard()` with new arguments.
- `client.on()` replaced with `XpEvents.on()`.
- All functions lose `client` and `message` arguments where applicable.
- `roleSetup.fetch()` replaced with `roleSetup.list()`.

## ❌ V2 Removals

- `lvlRole()` removed.
- `migrate` and `db` classes will be removed in future; use `Migrate` and `Database` instead.
- Old `roleSetup` methods no longer supported.
