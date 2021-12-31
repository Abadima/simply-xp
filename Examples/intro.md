# Lets Get Started

First things first, lets require our package.

```js
let xp = require('simply-xp')
```

Now we need to connect mongodb url with the package.

```js
xp.connect('mongodb://...') // Do it in main file (ONLY ONCE)
```

**_Options of [connect()](https://github.com/Rahuletto/simply-xp/blob/main/Examples/connect.md)_**

# Examples

- **Give XP For Each Message Sent**

```js
client.on('messageCreate', async (message) => {
  if (!message.guild) return
  if (message.author.bot) return

  const random = Math.floor(Math.random() * 29) + 1 // Min 1, Max 30
  xp.addXP(message, message.author.id, message.guild.id, random)
})
```

Hard to understand and make a randomizer ?? No Problem ! We have built in randomizer

```js
xp.addXP(message, message.author.id, message.guild.id, {
  min: 1,
  max: 30
})
```

**_Options of [addXP()](https://github.com/Rahuletto/simply-xp/blob/main/Examples/addXP.md)_**

**Level Up Message**

Using addXP, we can make Level Up announcements by using 'levelUp' event

```js
client.on('levelUp', async (message, data) => {
  message.reply(
    `${message.author}, *Level Up!* Now you are in ***Level ${data.level}***. Using simply-xp`
  )
})
```

In levelUp event. the data returns `<Object>`

```
 {
   xp,
   level,
   userID,
   guildID
 }
```

- **Rank Command**

_Confused by discord-xp ?_ **XD** we have the easiest rank system ever

```js
let member = message.mentions.members.first()?.id || message.author.id

xp.rank(message, member, message.guild.id).then((img) => {
  message.reply({ files: [img] })
})
```

**_Slash Support ??_** eh we got you covered !

### Note !

- You need well experience in slash commands to use this !

```js
// in interactionCreate (Slash command)
await interaction.deferReply()

let member = interaction.options.getUser('user') || interaction.user

xp.rank(interaction, member.id, interaction.guild.id).then((img) => {
  interaction.followUp({ files: [img] })
})
```

**_Options of [rank()](https://github.com/Rahuletto/simply-xp/blob/main/Examples/rank.md)_**

---

- **Leaderboard Command**

Simpler than ever !

```js
await xp.leaderboard(client, message.guild.id).then(board => {
   let lead = []

     board.forEach(user => {
       lead.push(`• ${user.tag} - XP: ${user.shortxp}`)
     })

if(lead.length <= 1) {
    lead = 'No One is in the leaderboard'
}

     message.reply({ content: ` ${lead.toString().replaceAll(',', '\n')} `})
```

**_Pagination for leaderboard_** (using simply-djs)

```js
let simplydjs = require('simply-djs')

await xp.leaderboard(client, message.guild.id, 30).then(board => {
   let a = []
      let b = []

     board.forEach(user => {
       if (user.position <= 15) {
            a.push(`• ${user.tag} - XP: ${user.shortxp}`)
          } else if (user.position > 15 && user.position <= 30) {
            b.push(`• ${user.tag} - XP: ${user.shortxp}`)
          }
     })

let emb = new Discord.MessageEmbed()
        .setTitle('Leaderboard')
        .setDescription(`***1 - 15 Users*** **leaderboard**\n\`\`\`\n${a.toString().replaceAll(',', '\n')}\n\`\`\``)
        .setColor('#075FFF')


      let emb2 = new Discord.MessageEmbed()
        .setTitle('Leaderboard')
        .setDescription(`***16 - 30 Users*** **leaderboard**\n\`\`\`\n${b.toString().replaceAll(',', '\n')}\n\`\`\``)
        .setColor('#6a48d1')

      let pg = [emb, emb2]
      simplydjs.embedPages(client, message, pg, { slash: false })

```

**_Options of [leaderboard()](https://github.com/Rahuletto/simply-xp/blob/main/Examples/leaderboard.md)_**

- **Charts** (Using ChartJS)

Make Charts cuz why not ;)

```js
xp.charts(message).then((attach) => {
  message.reply({ files: [attach] })
})
```

**_Options of [charts()](https://github.com/Rahuletto/simply-xp/blob/main/Examples/charts.md)_**

- **Level Roles**

Auto Roles (or) Level Roles.. Hard to understand, easy to implement !

### Add LevelRole

```js
if (message.content.startsWith(`${prefix}addrole`)) {
  // add Level Role to the database
  xp.roleSetup
    .add(client, guildID, {
      level: args[1],
      role: args[2]
    })
    .then((l) => {
      // Replying to the message saying Done
      if (l) {
        message.reply({ content: 'Added to Database' })
      }
    })
    .catch((e) => {
      // Catch if there is any error
      message.reply({ content: `Error: ${e}` })
    })
}
```

### Remove LevelRole

```js
if (message.content.startsWith(`${prefix}removerole`)) {
  // remove Level Role from the database
  xp.roleSetup
    .remove(client, guildID, {
      level: args[1]
    })
    .then((l) => {
      // Replying to the message saying Done
      if (l) {
        message.reply({ content: 'Removed from Database' })
      }
    })
    .catch((e) => {
      // Catch if there is any error
      message.reply({ content: `Error: ${e}` })
    })
}
```

### Fetch LevelRole

```js
if (message.content.startsWith(`${prefix}fetchrole`)) {
  // fetch all level roles
  xp.roleSetup.fetch(client, guildID).then((l) => {
    // Sending the data
    if (l) {
      message.reply({ content: JSON.stringify(l) })
    }
  })
}
```

### Find LevelRole

```js
if (message.content.startsWith(`${prefix}findrole`)) {
  // find a specific level role
  xp.roleSetup.find(client, guildID, args[1]).then((l) => {
    // Sending the data
    message.reply({ content: JSON.stringify(l) })
  })
}
```

**_Lets get Simpler !_**
