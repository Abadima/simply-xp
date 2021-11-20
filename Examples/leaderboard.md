# leaderboard

Get the whole leaderboard of the guild | `leaderboard`

### Usage

```js
let xp = require('simply-xp')

await xp.leaderboard(client, message.guild.id)
```

You have the ability to limit the user count of the leaderboard

```js
await xp.leaderboard(client, message.guild.id, limit)
```

### Example

```js
let xp = require('simply-xp')

await xp.leaderboard(client, message.guild.id, 10)
```

- ## Returns `<Array of Objects>`

```
[
  {
   guildID: guild id,
   userID: user id,
   level: level,
   xp: xp,
   position: also known as rank,
   username: Username of the user,
   tag: Tag of the user,
   shortxp: shortened XP,
  },
  // soo on
]
```

### Example

```js
await xp.leaderboard(client, message.guild.id).then(board => {
   let lead = []

     board.forEach(user => {
       lead.push(`• ${user.tag} - XP: ${user.shortxp}`)
     })

     message.reply({ content: ` ${lead.toString().replaceAll(',', '\n')} `})
```
