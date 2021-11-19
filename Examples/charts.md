# charts

Generate Charts using ChartJS | `charts`

### With Customization

```js
let xp = require('simply-xp')

xp.charts(message, {
  position: 5,
  type: 'bar'
}).then((attach) => {
  message.reply({ files: [attach] })
})
```

- ## Returns `<MessageAttachment>`

## Options

- **position** `(Number)` - Number of users need to be in the chart [Default: 5]
- **background** `(Hex Code)` - Background Color of the Charts
- **type** `(String)` - Types from [ChartJS](https://www.chartjs.org/docs/latest/charts/line.html)
- - Available types: `'line' (or) 'bar' (or) 'radar' (or) 'doughnut' (or) 'polarArea'`
