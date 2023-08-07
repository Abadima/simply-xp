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

[![Documentation](https://img.shields.io/badge/SimplyXP-Documentation-6b46d4?style=for-the-badge)](https://simplyxp.js.org)
[![Support](https://img.shields.io/badge/Discord-Support-5865F2?style=for-the-badge&logo=discord)](https://discord.gg/hjhnjYJNHX)
</div>

---
> CREDITS TO [RAHULETTO](https://github.com/rahuletto) FOR SIMPLY-XP **VERSION 1**
---

<br>

## 🖥️ <b>[DEV] Installation</b>

```shell
npm install simply-xp@dev
```

```shell
pnpm install simply-xp@dev
```

```shell
yarn add simply-xp@dev
```

<br>

# ✅ V2 Additions

- Added support for `SQLite` database
- Added `debug`, `auto_create`, `auto_purge` options for `connect()` function
- Added `db` class for extended database functionality
- Added `leaderboardCard()` function
- Added `coreFunctions()` function
- Added `migrate` class

# 🎉 V2 Changes 🎉

- Better Documentation
- Better Log Handling (`XpDebug`, `XpError`, `XpInfo`, `XpWarn`)
- Better Performance
- Better Code Quality (EsLint)
- Complete TypeScript Rewrite
- Deleted `chart.js` dependency
- `fetch()` now also returns `position`, and accepts `username` parameter
- `roleSetup` functions now accept roleID arrays! `["role1", "role2", "role3"]`, and will return `timestamp` as a bonus!
- `reset()` function now accepts `username` and `erase` as optional arguments
- `addLevel(), addXP(), setLevel(), setXP()` now has a `username` parameter, to automatically create the user if it doesn't exist. 

# ⚠️ V2 Breaking Changes ⚠️

- `create()` Now requires `username` argument.
- `charts()` Requires new arguments.
- `rank()` is **deprecated**, use `rankCard()` instead.
- `rankCard()` Requires completely new arguments.
- `roleSetup()` functions loses `client` argument.