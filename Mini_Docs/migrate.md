<a name="migrate"></a>

## migrate

**Kind**: global class

* [migrate](#migrate)
    * [new migrate()](#new_migrate_new)
    * [.discord_xp(dbUrl, deleteOld)](#migrate.discord_xp) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.database(from)](#migrate.database) ⇒ <code>Promise.&lt;boolean&gt;</code>

<a name="new_migrate_new"></a>

### new migrate()

Migration functions

<a name="migrate.discord_xp"></a>

### migrate.discord\_xp(dbUrl, deleteOld) ⇒ <code>Promise.&lt;boolean&gt;</code>

Effortlessly migrate from discord-xp to simply-xp.

**Kind**: static method of [<code>migrate</code>](#migrate)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - - Returns true if migration is successful  
**Throws**:

- <code>XpFatal</code> - If parameters are not provided correctly

**Link**: `Documentation:` https://simplyxp.js.org/docs/migrate/discord_xp

| Param     | Type                 | Description                     |
|-----------|----------------------|---------------------------------|
| dbUrl     | <code>URL</code>     | MongoDB URL                     |
| deleteOld | <code>boolean</code> | Delete old data after migration |

<a name="migrate.database"></a>

### migrate.database(from) ⇒ <code>Promise.&lt;boolean&gt;</code>

Effortlessly migrate from MongoDB to SQLite. (or vice versa)

**Kind**: static method of [<code>migrate</code>](#migrate)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - - Returns true if migration is successful  
**Throws**:

- <code>XpFatal</code> - If parameters are not provided correctly

**Link**: `Documentation:` https://simplyxp.js.org/docs/migrate/database

| Param | Type                                                                |
|-------|---------------------------------------------------------------------|
| from  | <code>&quot;mongodb&quot;</code> \| <code>&quot;sqlite&quot;</code> | 

