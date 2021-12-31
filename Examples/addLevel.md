# addLevel

Add Level to a user | `addLevel`

### Usage

```js
let xp = require('simply-xp')

xp.addLevel(message, userID, guildID, level)
```

### Example

```js
let xp = require('simply-xp')

xp.addLevel(message, message.author.id, message.guild.id, 10)
```

- ## Returns `<Object>`

```
{
  level: 1,
  xp: 10
}
```

- ## Fires `levelUp` event

```js
client.on('levelUp', async (message, data, role) => {})
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
