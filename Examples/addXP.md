# addXP

Add XP to a user | `addXP`

### Usage

```js
let xp = require('simply-xp')

xp.addXP(userID, guildID, xp)
```

### Example

```js
let xp = require('simply-xp')

xp.addXP(message.author.id, message.guild.id, 10)
```

- **_Tip:_** It has built in randomizer.. Use it by

```js
let xp = require('simply-xp')

xp.addXP(message.author.id, message.guild.id, {
	min: 10,
	max: 25
})
```

## Options

- no options ;(
