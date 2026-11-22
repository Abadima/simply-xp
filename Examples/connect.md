# connect

Connects to Database | `connect`

## With Customization

```js
let xp = require("simply-xp");

xp.connect(mongoURI, {
  notify: true
});
```

## Without Customization

```js
let xp = require("simply-xp");

xp.connect(mongoURI);
```

- ## Returns `<Promise<void>>` once connected

Uses the official `mongodb` driver with its own connection, so it does not touch a `mongoose` connection of your own. Calling it again with the same URL is harmless. It also creates the indexes simply-xp needs, and drops the old one-record-per-user (`user_1`) index so a user can have XP in more than one guild.

Other functions wait up to 10 seconds for a connection that is still opening, or not started yet, and throw after that.

Needs Node.js 16.20.1 or newer (or Bun 1.1.39 or newer) and MongoDB 4.2 or newer. The database user must be allowed to create and drop indexes (the built-in `readWrite` role is).

## Options

- **notify** `(Boolean)` - Notifies when DB is connected
- **auto_purge** `(Boolean)` - `leaderboard` deletes the records of members who left the guild [Default: false]
