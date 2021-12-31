# addXP

Add XP to a user | `addXP`

### Usage

```js
let xp = require('simply-xp')

xp.addXP(message, userID, guildID, xp)
```

### Example

```js
let xp = require('simply-xp')

xp.addXP(message, message.author.id, message.guild.id, 10)
```

- **_Tip:_** It has built in randomizer.. Use it by

```js
let xp = require('simply-xp')

xp.addXP(message, message.author.id, message.guild.id, {
  min: 10,
  max: 25
})
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
client.on('levelUp', async (message, data) => {})
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
