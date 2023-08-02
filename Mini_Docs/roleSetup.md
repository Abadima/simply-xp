<a name="roleSetup"></a>

## roleSetup

**Kind**: global class

* [roleSetup](#roleSetup)
    * [new roleSetup()](#new_roleSetup_new)
    * [.add(guildId, options)](#roleSetup.add) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.find(guildId, levelNumber)](#roleSetup.find) ⇒ <code>Promise.&lt;RoleSetupObject&gt;</code>
    * [.remove(guildId, levelNumber)](#roleSetup.remove) ⇒ <code>Promise.&lt;boolean&gt;</code>

<a name="new_roleSetup_new"></a>

### new roleSetup()

Setup roles for levels

<a name="roleSetup.add"></a>

### roleSetup.add(guildId, options) ⇒ <code>Promise.&lt;boolean&gt;</code>

Add a role to the role setup

**Kind**: static method of [<code>roleSetup</code>](#roleSetup)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - - True if successful  
**Throws**:

- <code>XpFatal</code> If an invalid type is provided or value is not provided.

**Link**: `Documentation:` https://simplyxp.js.org/docs/roleSetup/add

| Param   | Type                         | Description        |
|---------|------------------------------|--------------------|
| guildId | <code>string</code>          | The guild ID       |
| options | <code>RoleSetupObject</code> | Level/role options |

<a name="roleSetup.find"></a>

### roleSetup.find(guildId, levelNumber) ⇒ <code>Promise.&lt;RoleSetupObject&gt;</code>

Find a role in roleSetup

**Kind**: static method of [<code>roleSetup</code>](#roleSetup)  
**Returns**: <code>Promise.&lt;RoleSetupObject&gt;</code> - - The level role object  
**Throws**:

- <code>XpFatal</code> If an invalid type is provided or value is not provided.

**Link**: `Documentation:` https://simplyxp.js.org/docs/roleSetup/find

| Param       | Type                | Description      |
|-------------|---------------------|------------------|
| guildId     | <code>string</code> | The guild ID     |
| levelNumber | <code>number</code> | The level number |

<a name="roleSetup.remove"></a>

### roleSetup.remove(guildId, levelNumber) ⇒ <code>Promise.&lt;boolean&gt;</code>

Remove a level from the role setup

**Kind**: static method of [<code>roleSetup</code>](#roleSetup)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - - True if successful  
**Throws**:

- <code>XpFatal</code> If an invalid type is provided or value is not provided.

**Link**: `Documentation:` https://simplyxp.js.org/docs/roleSetup/remove

| Param       | Type                | Description      |
|-------------|---------------------|------------------|
| guildId     | <code>string</code> | The guild ID     |
| levelNumber | <code>number</code> | The level number |

