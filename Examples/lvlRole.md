# lvlRole

Have Level Roles without killing brain cells | `lvlRole`

### Usage

```js
let xp = require('simply-xp')

xp.lvlRole(message, userID, {
	data: [
		{
			level: 'Number', // level number
			role: 'role id' // role id
		}
		// etc..
	]
})
```

### Example

```js
let xp = require('simply-xp')

xp.lvlRole(message, message.author.id, {
	data: [
		{
			level: '10',
			role: '123456789012345'
		}
		// etc..
	]
})
```

- ## Returns `<Boolean>`

### Options

- **data** `(Array)` - Data for giving roles when getting the level specified

### Data Options

- **level** `(Number)` - Gives role when the specified level is reached
- **role** `(Role ID)` - Role ID for giving the role when level is reached
