import type { SKRSContext2D } from "@napi-rs/canvas";

export const PRIMARY_FONT = "Baloo";
export const SECONDARY_FONT = "SecondaryFont";
export const FALLBACK_FONT = "FallbackFont";
/** The font stack the cards and charts draw with. */
export const CARD_FONT = `${PRIMARY_FONT}, ${FALLBACK_FONT}`;

/**
 * Draw a rounded rectangle with optional fill and stroke, can be used for clipping as well
 * @private
 */
export function RoundedBox(
	ctx: SKRSContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number,
	options?: {
		clip?: boolean;
		fill?: {
			color: string,
			alpha?: number
		}
		roundCorners?: {
			top?: boolean,
			bottom?: boolean
		};
		stroke?: {
			color: string,
			width: number
		};
	}) {

	const roundCorners = options?.roundCorners || { top: true, bottom: true };

	ctx.beginPath();
	ctx.moveTo(x + (roundCorners.top ? radius : 0), y);
	ctx.lineTo(x + width - (roundCorners.top ? radius : 0), y);
	if (roundCorners.top) {
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	}
	ctx.lineTo(x + width, y + height - (roundCorners.bottom ? radius : 0));
	if (roundCorners.bottom) {
		ctx.quadraticCurveTo(
			x + width,
			y + height,
			x + width - radius,
			y + height
		);
	}
	ctx.lineTo(x + (roundCorners.bottom ? radius : 0), y + height);
	if (roundCorners.bottom) {
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	}
	ctx.lineTo(x, y + (roundCorners.top ? radius : 0));
	if (roundCorners.top) {
		ctx.quadraticCurveTo(x, y, x + radius, y);
	}
	ctx.closePath();

	if (options?.fill) {
		if (options.clip) ctx.clip();
		if (options.fill.color) ctx.fillStyle = options.fill.color;
		if (options.fill.alpha) ctx.globalAlpha = options.fill.alpha;
		ctx.fillRect(x, y, width, height);
	}

	if (options?.stroke) {
		if (options.stroke.color) ctx.strokeStyle = options.stroke.color;
		if (options.stroke.width) ctx.lineWidth = options.stroke.width;
		ctx.stroke();
	}

	if (options?.clip) ctx.clip();
}

/** Draws `text` centered at `x`, shrinking the font from `maxSize` until it fits in `maxWidth`. */
export function dynamicFont(context: SKRSContext2D, text: string, x: number, y: number, maxWidth: number, maxSize: number) {
	let fontSize = maxSize;

	while (fontSize > 0) {
		context.font = `${fontSize}px ${CARD_FONT}`;
		if (context.measureText(text).width < maxWidth) {
			break;
		}
		fontSize--;
	}

	context.textAlign = "center";
	context.fillText(text, x, y);
}

/** Draws text with an outline: `font`, a `lineWidth` wide `stroke`, then the `fill`. */
export function strokedText(
	context: SKRSContext2D,
	text: string,
	x: number,
	y: number,
	style: { align?: CanvasTextAlign; fill?: string; font: string; lineWidth: number; maxWidth?: number; stroke: string }
): void {
	context.save();
	context.textAlign = style.align ?? "center";
	context.font = style.font;
	context.lineJoin = "round";
	context.lineWidth = style.lineWidth;
	context.strokeStyle = style.stroke;
	context.fillStyle = style.fill ?? "#ffffff";
	if (style.maxWidth === undefined) {
		context.strokeText(text, x, y);
		context.fillText(text, x, y);
	} else {
		context.strokeText(text, x, y, style.maxWidth);
		context.fillText(text, x, y, style.maxWidth);
	}
	context.restore();
}
