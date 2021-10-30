# connect

This is an example of `connect()`

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

## Options

- **notify** `(Boolean)` - Notifies when DB is connected
