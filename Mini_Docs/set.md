## Functions

<dl>
<dt><a href="#setLevel">setLevel(userId, guildId, level, username)</a> ⇒ <code>Promise.&lt;UserResult&gt;</code></dt>
<dd><p>Set user level</p>
</dd>
<dt><a href="#setXP">setXP(userId, guildId, xpData, username)</a> ⇒ <code>Promise.&lt;XPResult&gt;</code></dt>
<dd><p>Set user XP</p>
</dd>
</dl>

<a name="setLevel"></a>

## setLevel(userId, guildId, level, username) ⇒ <code>Promise.&lt;UserResult&gt;</code>

Set user level

**Kind**: global function  
**Returns**: <code>Promise.&lt;UserResult&gt;</code> - - Object of user data on success  
**Throws**:

- <code>XpFatal</code> - If parameters are not provided correctly

**Link**: `Documentation:` https://simplyxp.js.org/docs/setlevel

| Param    | Type                | Description                               |
|----------|---------------------|-------------------------------------------|
| userId   | <code>string</code> |                                           |
| guildId  | <code>string</code> |                                           |
| level    | <code>number</code> |                                           |
| username | <code>string</code> | Username to use if auto_create is enabled |

<a name="setXP"></a>

## setXP(userId, guildId, xpData, username) ⇒ <code>Promise.&lt;XPResult&gt;</code>

Set user XP

**Kind**: global function  
**Returns**: <code>Promise.&lt;XPResult&gt;</code> - - Object of user data on success  
**Throws**:

- <code>XpFatal</code> - If parameters are not provided correctly

**Link**: `Documentation:` https://simplyxp.js.org/docs/setxp

| Param    | Type                | Description                               |
|----------|---------------------|-------------------------------------------|
| userId   | <code>string</code> |                                           |
| guildId  | <code>string</code> |                                           |
| xpData   | <code>number</code> |                                           |
| username | <code>string</code> | Username to use if auto_create is enabled |

