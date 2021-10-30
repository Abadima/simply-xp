# connect

Connects to Database | `connect`

### With Customization

```js
let xp = require('simply-xp')

xp.connect(mongoURI, {
  notify: true
})
```

### Without Customization

```js
let xp = require('simply-xp')

xp.connect(mongoURI)
```

- ## Returns `<void>`

## Options

- **notify** `(Boolean)` - Notifies when DB is connected
