# rank

Generate Rank Card without canvacord madness | `rank`

## With Customization

```js
let xp = require("simply-xp");

xp.rank(message, userID, guildID, {
  background: "image url", // default: Rainbow Background
  color: "Hex Code" // default: #096DD1
}).catch((err) => {
  message.reply(err.toString());
});
```

- ## Returns `<MessageAttachment>`

Rejects when the user has no XP data. When the card cannot be drawn (the member is not cached, an image cannot be loaded) the error is logged and the promise resolves `undefined`.

## Options

- **background** `(Image URL)` - Background Image of the Rank Card
- **color** `(Hex Code)` - Theme Color of the Rank Card
- **lvlbar** `(Hex Code)` - Color of the levelBar
- **lvlbarBg** `(Hex Code)` - Color of the levelBar Background
