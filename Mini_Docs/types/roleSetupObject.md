## RoleSetupObject

### Properties

- `guild` (string, optional): The guild ID of the role setup.
- `level` (number): The level of the role setup.
- `roles` (string[] | string): The roles of the role setup.

### Example

```typescript
export type RoleSetupObject = {
	guild?: string;
	level: number;
	roles: string[] | string;
}
```