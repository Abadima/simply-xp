# charts

Generate Charts as a PNG image | `charts`

## With Customization

```js
let xp = require("simply-xp");

xp.charts(message, {
  position: 5,
  type: "bar"
}).then((attach) => {
  message.reply({ files: [attach] });
});
```

- ## Returns `<MessageAttachment>`

## Options

- **position** `(Number)` - Number of users need to be in the chart [Default: 5]
- **background** `(Hex Code)` - Background Color of the Charts
- **type** `(String)` - How the chart is drawn [Default: 'bar']
- - Available types: `'bar' (or) 'doughnut' (or) 'line' (or) 'pie' (or) 'polarArea' (or) 'radar'`
