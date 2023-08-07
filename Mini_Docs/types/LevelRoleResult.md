# LevelRoleResult

### Properties

- `_id` (string, optional): The ID of the document.
- `guild` (string): The guild ID of the level role.
- `level` (number): The level of the level role.
- `roles` (string[] | string): The roles of the level role.
- `timestamp` (string): The timestamp of the level role.

### Example

```typescript
export type LevelRoleResult = {
	_id?: string,
	guild: string;
	level: number;
	roles: Array<string>;
	timestamp: string;
}
```