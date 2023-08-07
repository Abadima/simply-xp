## ClientOptions

### Properties

- `auto_create` (boolean, optional): Whether to automatically create a database if it doesn't exist.
- `auto_purge` (boolean, optional): Whether to automatically purge the database if it exists.
- `dbOptions` (object, required): The database options.
- `notify` (boolean, optional): Whether to notify the user when they level up.
- `debug` (boolean, optional): Whether to enable debug mode.

### Example

```typescript
interface NewClientOptions {
	auto_create: boolean;
	auto_purge: boolean;
	dbOptions: { type: "mongodb" | "sqlite"; database: MongoClient | Database; };
	notify: boolean;
	debug: boolean;
}
```