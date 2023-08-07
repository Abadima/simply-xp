# XPResult

### Properties

- `_id` (string, optional): The ID of the document.
- `user` (string): The ID of the user.
- `name` (string, optional): The name of the user.
- `guild` (string): The ID of the guild.
- `level` (number): The level of the user in the guild.
- `xp` (number): The XP of the user in the guild.
- `hasLevelledUp` (boolean): Whether or not the user has levelled up.

### Example

```typescript
interface XPResult extends UserResult {
	hasLevelledUp: boolean;
}
```