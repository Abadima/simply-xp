<p align="center">
  <img src="https://i.ibb.co/cCKJ9FS/simplyxp.png" width="320" height="125" alt="XP Logo">
</p>

<h2 align="center">We have levelling! - You handle the rest.</h2>
<h3 align="center">Made by Abadima</h3>

<br>

<div align="center">

[![Downloads](https://img.shields.io/npm/dt/simply-xp?style=for-the-badge)](https://www.npmjs.com/package/simply-xp)
[![Version](https://img.shields.io/npm/v/simply-xp.svg?style=for-the-badge)](https://www.npmjs.com/package/simply-xp)
[![CodeFactor](https://www.codefactor.io/repository/github/abadima/simply-xp/badge?style=for-the-badge)](https://www.codefactor.io/repository/github/abadima/simply-xp/overview)

[![Documentation](https://img.shields.io/badge/SimplyXP-Documentation-6b46d4?style=for-the-badge)](https://simplyxp.js.org/docs/intro/)
[![Support](https://img.shields.io/badge/Discord-Support-5865F2?style=for-the-badge&logo=discord)](https://discord.gg/hjhnjYJNHX)

</div>

---

> CREDITS TO ORIGINAL CREATOR [RAHULETTO](https://github.com/rahuletto) FOR SIMPLY-XP **VERSION 1**

---

<br>

## 🖥️ <b>Installation</b>

```shell
npm install simply-xp@latest mongodb
```

(or)

```shell
npm install simply-xp@latest better-sqlite3
```

Install only the adapter you actually use:

- `mongodb` for the MongoDB adapter
- `better-sqlite3` for the SQLite adapter

simply-xp itself supports Node.js 14+, but the adapters set their own, higher floors:

| Adapter             | Requires Node.js |
| ------------------- | ---------------- |
| `better-sqlite3@13` | `>=22`           |
| `mongodb@7`         | `>=20.19`        |

<br>

## 🚀 Examples

### Connect to a database

```js
const { connect } = require("simply-xp");

// SQLite
await connect("./xp.sqlite", { type: "sqlite" });

// or MongoDB
await connect(process.env.MONGO_URI, { type: "mongodb" });
```

### Add and fetch XP

```js
const { addXP, fetch } = require("simply-xp");

const result = await addXP(userId, guildId, { min: 10, max: 25 }, username);
if (result.levelDifference > 0)
	console.log(`${username} levelled up to ${result.level}!`);

const user = await fetch(userId, guildId);
console.log(
	`${user.name} is level ${user.level} with ${user.xp} XP (rank #${user.position})`,
);
```

### Leaderboards

```js
const { leaderboard } = require("simply-xp");

const top10 = await leaderboard(guildId, 10);
for (const user of top10)
	console.log(`#${user.position} ${user.name} - ${user.xp} XP`);
```

### Level roles and events

```js
const { LevelRoles, XpEvents } = require("simply-xp");

await LevelRoles.add(guildId, { level: 5, roles: [roleId] });

XpEvents.on({
	levelUp: (user, newRoles) => {
		console.log(`${user.name} reached level ${user.level}!`);
		// newRoles are the role IDs LevelRoles has set for this level
	},
});
```

<br>

## ⚡ Benchmarks

> Benchmarks run for 50 iterations and report average/peak Node.js process memory as `heapUsed + external`, plus wall-clock execution time per iteration.

| Database | Avg Total Memory | Avg Completion Time | Peak Total Memory |
| -------- | ---------------- | ------------------- | ----------------- |
| SQLite   | 9.5 MB           | 0.9 s               | 11.0 MB           |
| MongoDB  | 34.5 MB          | 2.4 s               | 35.2 MB           |

**Test Environment (This Benchmark Run)**:

- **OS:** Ubuntu 26.04 (Linux 7.0.0-31-generic)
- **CPU:** AMD Ryzen 9 9950X3D
- **RAM:** 6400 MHz DDR5

> Benchmarks include common operations like addXP(), setLevel(), rankCard(), compareCard(), charts(), and leaderboardCard(). Actual usage may vary depending on server load, GC timing, and configuration.
>
> SQLite memory reflects simply-xp's footprint with a local file-based adapter,
> while MongoDB execution time is higher due to network latency and the nature of the database, but still performs well within typical expectations for a leveling system.

---

## 🆕 What's new in V2

This is a complete rewrite of simply-xp transitioning to TypeScript and a more modular architecture, with a focus on improved performance, better error handling, and more flexible database support. I've also removed `discord.js` as a dependency, making the library simply more flexible!

### ✅ Additions

- `SQLite` support (`better-sqlite3`) next to `MongoDB`, both optional peer dependencies, install only the one you use.
- New: `LevelRoles`, `compareCard()`, `leaderboardCard()`, `XpEvents`, `registerPlugins()`, `setFlags()`, `removeXP()`/`removeLevel()`, and a `Migrate` class for moving data around.
- Every XP/level mutation is now atomic, no more lost XP from concurrent updates hitting the same user.

### ⚠️ Breaking Changes

- Functions take plain IDs and strings now (`userId`, `guildId`, `username`), not a `message` or `client`.
- `roleSetup` / `lvlRole()` => `LevelRoles`. `rank()` => `rankCard()`.
- `fetch()` and `leaderboard()` return a different shape: `rank` is now `position`, and `reqxp`/`shortxp`/`shortreq` are gone.
- `create()` now requires a `username`. `charts()` no longer takes a `message`.
- Imports are named exports now: `const { connect, addXP } = require("simply-xp")` instead of `xp.addXP(...)`.

Full migration details: [v2.0.0 release notes](https://github.com/Abadima/simply-xp/releases/tag/v2.0.0).
