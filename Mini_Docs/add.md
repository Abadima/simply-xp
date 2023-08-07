## Functions

<dl>
<dt><a href="#addLevel">addLevel(userId, guildId, level, username)</a> ⇒ <code>Promise.&lt;UserResult&gt;</code></dt>
<dd><p>Add XP to a user</p>
</dd>
<dt><a href="#addXP">addXP(userId, guildId, xpData, username)</a> ⇒ <code>Promise.&lt;XPResult&gt;</code></dt>
<dd><p>Add XP to a user.</p>
</dd>
</dl>

<a name="addLevel"></a>

## addLevel(userId, guildId, level, username) ⇒ <code>Promise.&lt;UserResult&gt;</code>

Add XP to a user

**Kind**: global function  
**Returns**: <code>Promise.&lt;UserResult&gt;</code> - - Object of user data on success  
**Throws**:

- <code>XpFatal</code> - If parameters are not provided correctly

**Link**: `Documentation:` https://simplyxp.js.org/docs/addlevel

| Param    | Type                | Description                               |
|----------|---------------------|-------------------------------------------|
| userId   | <code>string</code> |                                           |
| guildId  | <code>string</code> |                                           |
| level    | <code>number</code> |                                           |
| username | <code>string</code> | Username to use if auto_create is enabled |

<a name="addXP"></a>

## addXP(userId, guildId, xpData, username) ⇒ <code>Promise.&lt;XPResult&gt;</code>

Add XP to a user.

**Kind**: global function  
**Returns**: <code>Promise.&lt;XPResult&gt;</code> - - Object of user data on success.  
**Throws**:

- <code>XpFatal</code> - If parameters are not provided correctly.

**Link**: `Documentation:` https://simplyxp.js.org/docs/addxp

| Param    | Type                                       | Description                                                              |
|----------|--------------------------------------------|--------------------------------------------------------------------------|
| userId   | <code>string</code>                        | The ID of the user.                                                      |
| guildId  | <code>string</code>                        | The ID of the guild.                                                     |
| xpData   | <code>number</code> \| <code>Object</code> | The XP to add, can be a number or an object with min and max properties. |
| username | <code>string</code>                        | Username to use if auto_create is enabled.                               |

