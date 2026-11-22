# leaderboard

Get the whole leaderboard of the guild | `leaderboard`

## Usage

```js
let xp = require("simply-xp");

await xp.leaderboard(client, message.guild.id);
```

Members who left the guild, and users with 0 XP, are left out. With the `auto_purge` option of `connect`, the records of members who left are deleted; a member Discord fails to look up for another reason (an outage, a rate limit) is only left out of that call. `charts` builds on this, so it purges too.

You have the ability to limit the user count of the leaderboard

```js
await xp.leaderboard(client, message.guild.id, limit);
```

## Example

```js
let xp = require("simply-xp");

await xp.leaderboard(client, message.guild.id, 10);
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

## Example With `.then()`

```js
await xp.leaderboard(client, message.guild.id).then(board => {
   let lead = []

     board.forEach(user => {
       lead.push(`• ${user.tag} - XP: ${user.shortxp}`)
     })

     message.reply({ content: ` ${lead.toString().replaceAll(',', '\n')} `})
```
