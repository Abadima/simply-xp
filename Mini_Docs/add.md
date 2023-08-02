## Functions

<dl>
<dt><a href="#addLevel">addLevel(userId, guildId, level)</a> ⇒ <code>Promise.&lt;{user: string, guild: string, level: number, xp: number}&gt;</code></dt>
<dd><p>Add XP to a user</p>
</dd>
<dt><a href="#addXP">addXP(userId, guildId, xp)</a> ⇒ <code>Promise.&lt;{user: string, guild: string, level: number, xp: number}&gt;</code></dt>
<dd><p>Add XP to a user.</p>
</dd>
</dl>

<a name="addLevel"></a>

## addLevel(userId, guildId, level) ⇒ <code>Promise.&lt;{user: string, guild: string, level: number, xp: number}&gt;</code>

Add XP to a user

**Kind**: global function  
**Returns**: <code>Promise.&lt;{user: string, guild: string, level: number, xp: number}&gt;</code> - - Object of user
data on success  
**Throws**:

- <code>XpFatal</code> - If parameters are not provided correctly

**Link**: `Documentation:` https://simplyxp.js.org/docs/addlevel

| Param   | Type                |
|---------|---------------------|
| userId  | <code>string</code> | 
| guildId | <code>string</code> | 
| level   | <code>number</code> | 

<a name="addXP"></a>

## addXP(userId, guildId, xp) ⇒ <code>Promise.&lt;{user: string, guild: string, level: number, xp: number}&gt;</code>

Add XP to a user.

**Kind**: global function  
**Returns**: <code>Promise.&lt;{user: string, guild: string, level: number, xp: number}&gt;</code> - - Object of user
data on success.  
**Throws**:

- <code>XpFatal</code> - If parameters are not provided correctly.

**Link**: `Documentation:` https://simplyxp.js.org/docs/addxp

| Param   | Type                                       | Description                                                              |
|---------|--------------------------------------------|--------------------------------------------------------------------------|
| userId  | <code>string</code>                        | The ID of the user.                                                      |
| guildId | <code>string</code>                        | The ID of the guild.                                                     |
| xp      | <code>number</code> \| <code>Object</code> | The XP to add, can be a number or an object with min and max properties. |

