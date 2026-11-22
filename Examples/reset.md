# reset

Resets user data | `reset`

## Usage

```js
let xp = require("simply-xp");

xp.reset(userID, guildID);
```

## Example

```js
let xp = require("simply-xp");

xp.reset(message.author.id, message.guild.id);
```

- ## Returns `<Object>`

```
{
  user: userID,
  guild: guildID,
  xp: 0,
  level: 0
}
```
