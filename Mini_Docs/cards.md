## Functions

<dl>
<dt><a href="#rankCard">rankCard(guild, user, options, locales)</a> ⇒ <code>Promise.&lt;{attachment: Buffer, description: string, name: string}&gt;</code></dt>
<dd><p>Generate a simple user rank card</p>
</dd>
<dt><a href="#leaderboardCard">leaderboardCard(data, options, guildInfo, locales)</a> ⇒ <code>Promise.&lt;{attachment: Buffer, description: string, name: string}&gt;</code></dt>
<dd><p>Generate a simple leaderboard card</p>
</dd>
</dl>

<a name="rankCard"></a>

## rankCard(guild, user, options, locales) ⇒ <code>Promise.&lt;{attachment: Buffer, description: string, name: string}&gt;</code>

Generate a simple user rank card

**Kind**: global function  
**Throws**:

- <code>XpFatal</code> - If parameters are not provided correctly

**Link**: [Documentation](https://simplyxp.js.org/docs/rankCard)

| Param   | Type                         | Description                                         |
|---------|------------------------------|-----------------------------------------------------|
| guild   | <code>Object</code>          | (id, name)                                          |
| user    | <code>UserOptions</code>     | (id, username, avatarURL)                           |
| options | <code>RankCardOptions</code> | (background, color, legacy, lvlbar, lvlbarBg, font) |
| locales | <code>rankLocales</code>     | [BETA] Translate the rank card                      |

<a name="leaderboardCard"></a>

## leaderboardCard(data, options, guildInfo, locales) ⇒ <code>Promise.&lt;{attachment: Buffer, description: string, name: string}&gt;</code>

Generate a simple leaderboard card

**Kind**: global function  
**Throws**:

- <code>XpFatal</code> - If parameters are not provided correctly

**Link**: [Documentation](https://simplyxp.js.org/docs/leaderboard)

| Param     | Type                            | Description                         |
|-----------|---------------------------------|-------------------------------------|
| data      | <code>Array.&lt;User&gt;</code> | Array of user data                  |
| options   | <code>LeaderboardOptions</code> | (artworkColor, artworkImage, light) |
| guildInfo | <code>Object</code>             | Guild info                          |
| locales   | <code>LeaderboardLocales</code> | Locales                             |

