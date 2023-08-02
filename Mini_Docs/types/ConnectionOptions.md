## ConnectionOptions

### Description

An interface representing the options for a database connection.

### Properties

- `type` (required, string): The type of the database. It can be one of the following values: "mongodb", "mysql", or "
  sqlite".
- `autopurge` (boolean, optional): Indicates whether to automatically purge data of users/servers that are no longer
  relevant. **(REQUIRES DISCORD/GUILDED)**
- `notify` (boolean, optional): Indicates whether to enable logging with simply-xp.
- `debug` (boolean, optional): Indicates whether to enable debugging with simply-xp.

### Example

```typescript
export type ConnectionOptions = {
	type: "mongodb" | "sqlite" | undefined;
	auto_purge?: false | unknown;
	notify?: boolean;
	debug?: boolean;
}
```