## await db.createOne(collection: ("simply-xps" | "simply-xp-levelroles"), query: object): `Promise<object>`

Create one document in the database.

- `collection` ("simply-xps" | "simply-xp-levelroles"): The name of the collection/table to create.
- `query` (object): The query object used to create the document.

**Throws:**

- `XpError`: If there is no database connection.

**Returns:**

- `Promise<object>`: A promise that resolves with the created document or void.

## await db.deleteOne(collection: ("simply-xps" | "simply-xp-levelroles"), query: object): `Promise<boolean>`

Delete one document in the database.

- `collection` ("simply-xps" | "simply-xp-levelroles"): The name of the collection to delete from.
- `query` (object): The query object used to filter the document to be deleted.

**Throws:**

- `XpError`: If there is no database connection.

**Returns:**

- `Promise<boolean>`: A promise that resolves with a boolean indicating whether the document was deleted or not.

## await db.findOne(collection: ("simply-xps" | "simply-xp-levelroles"), query: object): `Promise<object>`

Find one document in the database.

- `collection` ("simply-xps" | "simply-xp-levelroles"): The name of the collection to search in.
- `query` (object): The query object used to filter the results.

**Throws:**

- `XpError`: If there is no database connection.

**Returns:**

- `Promise<object>`: A promise that resolves with the found document.

---

## await db.find(collection: ("simply-xps" | "simply-xp-levelroles"), query: object): `Promise<object>`

Find many documents in the database.

- `collection` ("simply-xps" | "simply-xp-levelroles"): The name of the collection to search in.
- `query` (object): The query object used to filter the results.

**Throws:**

- `XpError`: If there is no database connection.

**Returns:**

- `Promise<object>`: A promise that resolves with the found documents.

---

## await db.updateOne(collection: ("simply-xps" | "simply-xp-levelroles"), query: object, update: object, options?: object): `Promise<object>`

Update one document in the database.

- `collection` ("simply-xps" | "simply-xp-levelroles"): The name of the collection to update.
- `query` (object): The query object used to filter the document to be updated.
- `update` (object): The update object containing the fields and values to update.
- `options` (object, optional): Additional options for the update operation.

**Throws:**

- `XpError`: If there is no database connection.

**Returns:**

- `Promise<object>`: A promise that resolves with the update result or void.