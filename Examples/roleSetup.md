# roleSetup

Have Level Roles without killing brain cells | `roleSetup`

### Usage

It is used to setup auto roles/level roles. Handled by `lvlRole`
**_Required ! `lvlRole`_**

```js
let xp = require('simply-xp')
```

**_Add Level Role command_**

```js
xp.roleSetup.add(client, guildID, {
  level: lvl,
  role: 'role id'
})
```

- ## Returns `<Boolean>`

---

**_Remove Level Role command_**

```js
xp.roleSetup.remove(client, guildID, {
  level: lvl
})
```

- ## Returns `<Boolean>`

---

### Examples

```js
let xp = require('simply-xp')
```

**_Add Level Role command_**

```js
xp.roleSetup
  .add(client, guildID, {
    level: 10,
    role: '12345678901234'
  })
  .then((l) => {
    if (l) {
      message.reply({ content: 'Added to Database' })
    }
  })
  .catch((e) => {
    message.reply({ content: `Error: ${e}` })
  })
```

---

**_Remove Level Role command_**

```js
xp.roleSetup
  .remove(client, guildID, {
    level: 10
  })
  .then((l) => {
    if (l) {
      message.reply({ content: 'Removed from Database' })
    }
  })
  .catch((e) => {
    message.reply({ content: `Error: ${e}` })
  })
```

---

## Options

### Options for add

- **level** `(Number)` - Target level for the role
- **role** `(Role ID)` - Role given when the level is reached

### Options for remove

- **level** `(Number)` - Remove the Target level from Database
