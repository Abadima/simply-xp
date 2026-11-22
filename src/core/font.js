const { join } = require("path");

const FONT_FAMILY = "Sans Serif";

let registered = false;

/** Registers the bundled font once; returns a builder for `ctx.font`. */
function useFont(Canvas) {
	if (!registered) {
		Canvas.GlobalFonts.registerFromPath(join(__dirname, "..", "Fonts", "Baloo2-Regular.woff2"), FONT_FAMILY);
		registered = true;
	}
	return (size) => `${size}px "${FONT_FAMILY}"`;
}

module.exports = useFont;
