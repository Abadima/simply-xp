# rank

Generate Rank Card without canvacord madness | `rank`

### With Customization

```js
let xp = require('simply-xp')

xp.rank(message, userID, guildID, {
  background: 'image url', // default: Rainbow Background
  color: 'Hex Code' // default: #075FFF
}).catch((err) => {
  message.reply(err.toString())
})
```

- ## Returns `<MessageAttachment>`

## Options

- **background** `(Image URL)` - Background Image of the Rank Card
- **color** `(Hex Code)` - Theme Color of the Rank Card
- **lvlbar** `(Hex Code)` - Color of the levelBar
- **lvlbarBg** `(Hex Code)` - Color of the levelBar Background
