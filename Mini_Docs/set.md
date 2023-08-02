## Functions

<dl>
<dt><a href="#setLevel">setLevel(userId, guildId, level)</a> ⇒ <code>Promise.&lt;{user: string, guild: string, level: number, xp: number}&gt;</code></dt>
<dd><p>Set user level</p>
</dd>
<dt><a href="#setXP">setXP(userId, guildId, xp)</a> ⇒ <code>Promise.&lt;object&gt;</code></dt>
<dd><p>Set user XP</p>
</dd>
</dl>

<a name="setLevel"></a>

## setLevel(userId, guildId, level) ⇒ <code>Promise.&lt;{user: string, guild: string, level: number, xp: number}&gt;</code>

Set user level

**Kind**: global function  
**Returns**: <code>Promise.&lt;{user: string, guild: string, level: number, xp: number}&gt;</code> - - Object of user
data on success  
**Throws**:

- <code>XpFatal</code> - If parameters are not provided correctly

**Link**: `Documentation:` https://simplyxp.js.org/docs/setlevel

| Param   | Type                |
|---------|---------------------|
| userId  | <code>string</code> | 
| guildId | <code>string</code> | 
| level   | <code>number</code> | 

<a name="setXP"></a>

## setXP(userId, guildId, xp) ⇒ <code>Promise.&lt;object&gt;</code>

Set user XP

**Kind**: global function  
**Returns**: <code>Promise.&lt;object&gt;</code> - - Object of user data on success  
**Throws**:

- <code>XpFatal</code> - If parameters are not provided correctly

**Link**: `Documentation:` https://simplyxp.js.org/docs/setxp

| Param   | Type                |
|---------|---------------------|
| userId  | <code>string</code> | 
| guildId | <code>string</code> | 
| xp      | <code>number</code> | 

