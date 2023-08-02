## LeaderboardCardOptions

### Description

An interface representing the options for a rank card.

### Properties

- `artworkColors` (Array<HexColor>, optional): The colors of the artwork.
- `artworkImage` (URL, optional): The image of the artwork.
- `borderColors` (Array<HexColor>, optional): The colors of the border.
- `backgroundColor` (HexColor, optional): The background color of the leaderboard.
- `backgroundImage` (URL, optional): The background image of the leaderboard.
- `font` (string, optional): The font of the leaderboard.
- `light` (boolean, optional): Indicates whether to use the light theme.

### Example

```typescript
export type LeaderboardOptions = {
	artworkColors?: [HexColor, HexColor];
	artworkImage?: URL;
	borderColors?: [HexColor, HexColor];
	backgroundColor?: HexColor;
	backgroundImage?: URL;
	font?: string;
	light?: boolean;
}
```

## LeaderboardLocales

### Properties

- `level` (string, default: `"LEVEL"`): The text to be displayed for the level.
- `members` (string, default: `"Members"`): The text to be displayed for the members.

### Example

```typescript
export type LeaderboardLocales = {
	level?: string;
	members?: string;
}
```