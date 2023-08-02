## convert(type: `("level" | "xp")`, value: number): `number`

Reset user levels to 0 in a guild.

- `type` ("level" | "xp"): Type of value to convert **from**.
- `value` (number): The value to convert.

**Throws:**

- `XpError`: If type is not "level" or "xp". If value is not a number.

**Returns:**

- `number`: The converted value.

### [JS] Example

```javascript
const {convert} = require("simply-xp");

const userLevel = 10;
const userXp = 1000;

await convert("level", userLevel);
await convert("xp", userXp);
```