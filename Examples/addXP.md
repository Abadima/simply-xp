# addXP

Add XP to a user | `addXP`

## Usage

```js
let xp = require("simply-xp");

xp.addXP(message, userID, guildID, xp);
```

## Example

```js
let xp = require("simply-xp");

xp.addXP(message, message.author.id, message.guild.id, 10);
```

- **_Tip:_** It has built in randomizer (`max` is not included).. Use it by

```js
let xp = require("simply-xp");

xp.addXP(message, message.author.id, message.guild.id, {
  min: 10,
  max: 25
});
```

- ## Returns `<Object>`

```
{
  level: 0,
  xp: 10
}
```

- ## Fires `levelUp` event

```js
client.on("levelUp", async (message, data, role) => {});
```

- - ### data Returns `<Object>`

```
{
  xp,
  level,
  userID,
  guildID
}
```

- - ### role Returns `<Array>` of the level roles set for the new level (`{ lvl, role }`), or `undefined` when no roles are set up
