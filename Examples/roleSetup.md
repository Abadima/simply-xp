# roleSetup

Have Level Roles without killing brain cells | `roleSetup`

## Usage

It is used to setup auto roles/level roles. Handled by `lvlRole`
**_Required ! `lvlRole`_**

```js
let xp = require("simply-xp");
```

**_Add Level Role command_**

```js
xp.roleSetup.add(client, guildID, {
  level: lvl,
  role: "role id"
});
```

- ## Returns `<Boolean>` (add)

---

**_Remove Level Role command_**

```js
xp.roleSetup.remove(client, guildID, {
  level: lvl
});
```

- ## Returns `<Boolean>` (remove)

**_Fetch Level Role command_**

```js
xp.roleSetup.fetch(client, guildID);
```

- ## Returns `<Array>` of `{ lvl, role }`, or `undefined` when the guild has no level roles

**_Find Level Role command_**

```js
xp.roleSetup.find(client, guildID, level);
```

- ## Returns `<Array>` of the `{ lvl, role }` set for that level, or `undefined` when the guild has no level roles

---

## Options

### Options for add

- **level** `(Number|String)` - Target level for the role
- **role** `(Role ID)` - Role given when the level is reached

### Options for remove

- **level** `(Number|String)` - Remove the Target level from Database

---

### Examples

```js
let xp = require("simply-xp");
```

**_Add Level Role command_**

```js
xp.roleSetup
  .add(client, guildID, {
    level: 10,
    role: "12345678901234"
  })
  .then((l) => {
    if (l) {
      message.reply({ content: "Added to Database" });
    }
  })
  .catch((e) => {
    message.reply({ content: `Error: ${e}` });
  });
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
      message.reply({ content: "Removed from Database" });
    }
  })
  .catch((e) => {
    message.reply({ content: `Error: ${e}` });
  });
```

---
