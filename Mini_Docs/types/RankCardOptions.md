## RankCardOptions

### Description

An interface representing the options for a rank card.

### Properties

- `background` (string, optional): The background image of the rank card.
- `color` (string, optional): The color of the rank card.
- `legacy` (boolean, optional): Indicates whether to use the legacy rank card.
- `lvlbar` (HexColor, optional): The color of the level bar.
- `lvlbarBg` (HexColor, optional): The background color of the level bar.
- `font` (string, optional): The font of the rank card.

### Example

```typescript
export type RankCardOptions = {
	background?: URL;
	color?: HexColor;
	legacy?: boolean;
	lvlbar?: HexColor;
	lvlbarBg?: HexColor;
	font?: string;
};
```

## rankLocales

### Properties

- `level` (string, default: `"Level"`): The text to be displayed for the level.
- `next_level` (string, default: `"Next Level"`): The text to be displayed for the next level.
- `xp` (string, default: `"XP"`): The text to be displayed for the XP.

### Example

```typescript
export type rankLocales = {
	level?: string;
	next_level?: string;
	xp?: string;
}
```

## UserOptions

### Properties

- `id` (string): The ID of the user.
- `username` (string): The username of the user.
- `avatarURL` (string): The avatar URL of the user.

### Example

```typescript
export type UserOptions = {
	id: string;
	username: string;
	avatarURL: string;
}
```