# UserResult

### Properties

- `_id` (string, optional): The ID of the document.
- `user` (string): The ID of the user.
- `name` (string, optional): The name of the user.
- `guild` (string): The ID of the guild.
- `level` (number): The level of the user in the guild.
- `xp` (number): The XP of the user in the guild.

### Example

```typescript
export interface UserResult {
	_id?: string,
	user: string;
	name?: string;
	guild: string;
	level: number;
	xp: number;
}
```