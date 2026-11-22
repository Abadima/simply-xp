# addLevel

Add Level to a user | `addLevel`

## Usage

```js
let xp = require("simply-xp");

xp.addLevel(message, userID, guildID, level);
```

## Example

```js
let xp = require("simply-xp");

xp.addLevel(message, message.author.id, message.guild.id, 10);
```

- ## Returns `<Object>`

```
{
  level: 10,
  xp: 10000
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
