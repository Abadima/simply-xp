## Functions

<dl>
<dt><a href="#convertFrom">convertFrom(type)</a> ⇒ <code>number</code></dt>
<dd><p>Convert XP to level and vice versa.</p>
</dd>
<dt><a href="#updateOptions">updateOptions(clientOptions)</a> ⇒ <code>void</code></dt>
<dd><p>Updates the options of the XP client.</p>
</dd>
</dl>

<a name="convertFrom"></a>

## convertFrom(type) ⇒ <code>number</code>

Convert XP to level and vice versa.

**Kind**: global function  
**Returns**: <code>number</code> - - The converted value. (XP to level or level to XP)  
**Throws**:

- <code>XpFatal</code> If an invalid type is provided or if the value is not provided.

**Link**: `Documentation:` https://simplyxp.js.org/docs/utilities/convert

| Param  | Type                                                          | Description                            |
|--------|---------------------------------------------------------------|----------------------------------------|
| value. | <code>number</code>                                           |                                        |
| type   | <code>&quot;xp&quot;</code> \| <code>&quot;level&quot;</code> | Type to convert from (Default: level). |

<a name="updateOptions"></a>

## updateOptions(clientOptions) ⇒ <code>void</code>

Updates the options of the XP client.

**Kind**: global function  
**Returns**: <code>void</code> - - Nothing.  
**Throws**:

- <code>XpFatal</code> If an invalid option is provided.

**Link**: `Documentation:` https://simplyxp.js.org/docs/utilities/updateOptions

| Param         | Type                          | Description                |
|---------------|-------------------------------|----------------------------|
| clientOptions | <code>NewClientOptions</code> | The new options to update. |

