<a name="db"></a>

## db

**Kind**: global class

* [db](#db)
    * [new db()](#new_db_new)
    * [.createOne(query)](#db.createOne) ⇒ <code>Promise.&lt;(UserResult\|LevelRoleResult)&gt;</code>
    * [.deleteOne(query)](#db.deleteOne) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.findOne(query)](#db.findOne) ⇒ <code>Promise.&lt;(UserResult\|LevelRoleResult)&gt;</code>
    * [.find(query)](#db.find) ⇒ <code>Promise.&lt;(Array.&lt;UserResult&gt;\|Array.&lt;LevelRoleResult&gt;)&gt;</code>
    * [.updateOne(filter, update, [options])](#db.updateOne) ⇒ <code>Promise.&lt;(UserResult\|LevelRoleResult)
      &gt;</code>

<a name="new_db_new"></a>

### new db()

Database class providing methods to interact with the database.

<a name="db.createOne"></a>

### db.createOne(query) ⇒ <code>Promise.&lt;(UserResult\|LevelRoleResult)&gt;</code>

Creates one document in the database.

**Kind**: static method of [<code>db</code>](#db)  
**Returns**: <code>Promise.&lt;(UserResult\|LevelRoleResult)&gt;</code> - The created document.  
**Throws**:

- <code>XpFatal</code> Throws an error if there is no database connection.

**Link**: https://simplyxp.js.org/docs/handlers/database#createOne Documentation

| Param | Type                                                      | Description             |
|-------|-----------------------------------------------------------|-------------------------|
| query | <code>UserOptions</code> \| <code>LevelRoleOptions</code> | The document to create. |

<a name="db.deleteOne"></a>

### db.deleteOne(query) ⇒ <code>Promise.&lt;boolean&gt;</code>

Deletes one document from the database.

**Kind**: static method of [<code>db</code>](#db)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - `true` if the document was successfully deleted,
otherwise `false`.  
**Throws**:

- <code>XpFatal</code> Throws an error if there is no database connection.

**Link**: https://simplyxp.js.org/docs/handlers/database#deleteOne Documentation

| Param | Type                                                      | Description             |
|-------|-----------------------------------------------------------|-------------------------|
| query | <code>UserOptions</code> \| <code>LevelRoleOptions</code> | The document to delete. |

<a name="db.findOne"></a>

### db.findOne(query) ⇒ <code>Promise.&lt;(UserResult\|LevelRoleResult)&gt;</code>

Finds one document in the database.

**Kind**: static method of [<code>db</code>](#db)  
**Returns**: <code>Promise.&lt;(UserResult\|LevelRoleResult)&gt;</code> - The found document.  
**Throws**:

- <code>XpFatal</code> Throws an error if there is no database connection.

**Link**: https://simplyxp.js.org/docs/handlers/database#findOne Documentation

| Param | Type                                                      | Description                           |
|-------|-----------------------------------------------------------|---------------------------------------|
| query | <code>UserOptions</code> \| <code>LevelRoleOptions</code> | The query to search for the document. |

<a name="db.find"></a>

### db.find(query) ⇒ <code>Promise.&lt;(Array.&lt;UserResult&gt;\|Array.&lt;LevelRoleResult&gt;)&gt;</code>

Finds multiple documents in the database.

**Kind**: static method of [<code>db</code>](#db)  
**Returns**: <code>Promise.&lt;(Array.&lt;UserResult&gt;\|Array.&lt;LevelRoleResult&gt;)&gt;</code> - An array of found
documents.  
**Throws**:

- <code>XpFatal</code> Throws an error if there is no database connection.

**Link**: https://simplyxp.js.org/docs/handlers/database#find Documentation

| Param | Type                                                      | Description                                 |
|-------|-----------------------------------------------------------|---------------------------------------------|
| query | <code>UserOptions</code> \| <code>LevelRoleOptions</code> | The query to search for multiple documents. |

<a name="db.updateOne"></a>

### db.updateOne(filter, update, [options]) ⇒ <code>Promise.&lt;(UserResult\|LevelRoleResult)&gt;</code>

Updates one document in the database.

**Kind**: static method of [<code>db</code>](#db)  
**Returns**: <code>Promise.&lt;(UserResult\|LevelRoleResult)&gt;</code> - The updated document.  
**Throws**:

- <code>XpFatal</code> Throws an error if there is no database connection.

**Link**: https://simplyxp.js.org/docs/handlers/database#updateOne Documentation

| Param     | Type                                                      | Description                                |
|-----------|-----------------------------------------------------------|--------------------------------------------|
| filter    | <code>UserOptions</code> \| <code>LevelRoleOptions</code> | The document to update.                    |
| update    | <code>UserOptions</code> \| <code>LevelRoleOptions</code> | The document update data.                  |
| [options] | <code>object</code>                                       | MongoDB options for updating the document. |

