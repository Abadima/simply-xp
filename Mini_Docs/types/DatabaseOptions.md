## UserOptions

### Description

An interface representing the options for many Database methods.

### Properties

- collection `(string)`: The name of the collection to search in.
- data `(object)`: The data to be inserted into the database.
- guild `(string)`: The ID of the guild for whom the document is related to.
- user `(string)`: The ID of the user for whom the document is related to.
- name `(string)`: The name of the user for whom the document is related to.
- level `(number)`: The level of the user in the guild.
- xp `(number)`: The XP of the user in the guild.

### Example

```typescript
export type UserOptions = {
	collection: "simply-xps";
	data: {
		guild: string;
		user?: string;
		name?: string;
		level?: number;
		xp?: number;
	};
}
```

## LevelRoleOptions

### Description

An interface representing the options for many Database methods.

### Properties

- collection `(string)`: The name of the collection to search in.
- data `(object)`: The data to be inserted into the database.
- guild `(string)`: The ID of the guild for whom the document is related to.
- level `(number)`: The level of the user in the guild.
- roles `(string | Array<string>)`: The role(s) to be assigned to the user when they reach the specified level.

### Example

```typescript
export type LevelRoleOptions = {
	collection: "simply-xp-levelroles";
	data: {
		guild: string;
		level?: number;
		roles?: string | Array<string>;
	};
}
```