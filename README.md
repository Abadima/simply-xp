<div class="Heading" style="text-align: center;">
  <img src="https://i.ibb.co/cCKJ9FS/simplyxp.png" width="320" height="125" alt="XP Logo">

<h2>We have levelling! - You handle the rest.</h2>
<h3>Made by Abadima</h3>
</div>

<br>
<div class="badges" style="text-align: center;">

[![Downloads](https://img.shields.io/npm/dt/simply-xp?style=for-the-badge)](https://www.npmjs.com/package/simply-xp)
[![Version](https://img.shields.io/npm/v/simply-xp.svg?style=for-the-badge)](https://www.npmjs.com/package/simply-xp)
[![CodeFactor](https://www.codefactor.io/repository/github/abadima/simply-xp/badge?style=for-the-badge)](https://www.codefactor.io/repository/github/abadima/simply-xp)

[![Documentation](https://img.shields.io/badge/SimplyXP-Documentation-6b46d4?style=for-the-badge)](https://simplyxp.js.org/docs/next/intro/)
[![Support](https://img.shields.io/badge/Discord-Support-5865F2?style=for-the-badge&logo=discord)](https://discord.gg/hjhnjYJNHX)
</div>

---
> CREDITS TO [RAHULETTO](https://github.com/rahuletto) FOR SIMPLY-XP **VERSION 1**
---

<br>

## 🖥️ <b>[DEV] Installation</b>

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
- Add `compareCard()`
- Add `convertFrom()`
- Add `db` class for extended database functionality
- Add `https()`
- Add `leaderboardCard()`
- Add `migrate` class
- Add `SQLite` Support
- Add `roleSetup.getRoles()`
- Add `registerPlugins()`
- Add `removeLevel()` and `removeXP()`.
- Add `roleSetup.getRoles()`
- Add `updateOptions()`
- Add `xp_rate` Support For Unique Level Rates!

## 🎉 V2 Changes

- All functions returning either `UserResult` or `LevelRoleResult` now includes `lastUpdated` property.
- Better Performance & Reduced RAM overhead.
- Better Code Quality (EsLint)
- Complete & Revamped Documentation
- Complete TypeScript Rewrite
- New Fonts
- Reduced Package Size!
- Renewed Logging System (`XpLog`)
- Deleted `chart.js` dependency
- `addLevel(), addXP(), setLevel(), setXP()` now has a `username` parameter, to automatically create the user if it doesn't exist.
- `fetch()` now also returns `position`, and accepts `username` parameter
- `leaderboard()` now supports Global Leaderboards, by simply not passing a `guildID` argument.
- `roleSetup` functions now accept RoleID arrays! `["role1", "role2", "role3"]`.
- `reset()` function now accepts `erase` and `username` as optional arguments

## ⚠️ V2 Breaking Changes

- All functions lose `client` and `message` arguments where applicable.
- `create()` Now requires `username` argument.
- `charts()` Requires new arguments, and is revamped.
- `rank()` is **removed**, use `rankCard()` instead. (REQUIRES NEW ARGUMENTS)
- `leaderboard()` replaces `userID` with `user` in `UserResult`.
- `client.on()` => `XpEvents.on()` (READ DOCS)
- `roleSetup` functions loses `client` argument.
- `roleSetup.fetch()` => `roleSetup.list()`

## ❌ V2 Removals

- `lvlRole()` is removed, use `roleSetup.getRoles()` instead. (READ DOCS)