const shortener = require("./core/shortener");
const useFont = require("./core/font");

const WIDTH = 1080;
const HEIGHT = 400;
const CORNER_RADIUS = 20;
const CONTENT_X = 390;
const GUILD_BOX = { x: CONTENT_X, y: 305, width: 660, height: 70 };
const BAR_BOX = { x: CONTENT_X, y: 145, width: 660, height: 50 };
const BADGE_SIZE = { width: 180, height: 50 };
const DEFAULT_BACKGROUND = "https://i.ibb.co/QQvMqf7/gradient.jpg";
const DEFAULT_ACCENT = "#096DD1";
const OUTLINE = "#BFC85A22";

function roundedBox(ctx, x, y, width, height, radius) {
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	ctx.lineTo(x + width, y + height - radius);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	ctx.lineTo(x + radius, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	ctx.lineTo(x, y + radius);
	ctx.quadraticCurveTo(x, y, x + radius, y);
	ctx.closePath();
}

function fillBox(ctx, { x, y, width, height }) {
	ctx.fillRect(x, y, width, height);
}

function paintInRoundedBox(ctx, box, paint) {
	ctx.save();
	roundedBox(ctx, box.x, box.y, box.width, box.height, CORNER_RADIUS);
	ctx.strokeStyle = OUTLINE;
	ctx.stroke();
	ctx.clip();
	paint();
	ctx.restore();
}

function drawStatBadge(ctx, font, accent, x, y, text) {
	const box = { x, y, ...BADGE_SIZE };
	paintInRoundedBox(ctx, box, () => {
		ctx.fillStyle = accent;
		fillBox(ctx, box);
		ctx.fillStyle = "#ffffff";
		ctx.font = font(32);
		ctx.textAlign = "center";
		ctx.fillText(text, x + box.width / 2, y + 38);
	});
}

function drawShadowedText(ctx, font, text, x, y, size, align) {
	ctx.save();
	ctx.textAlign = align;
	ctx.fillStyle = "#ffffff";
	ctx.shadowColor = "#000000";
	ctx.shadowBlur = 15;
	ctx.shadowOffsetX = 1;
	ctx.shadowOffsetY = 1;
	ctx.font = font(size);
	ctx.fillText(text, x, y);
	ctx.restore();
}

function guildNameFontSize(name) {
	if (name.length >= 63) return 22;
	if (name.length >= 40) return 28;
	if (name.length >= 23) return 38;
	return 45;
}

/**
 * @param {{user: import("discord.js").User, guildName: string, level: number, xp: number, reqxp: number, rank: number}} data
 * @param {{background?: string, color?: string, lvlbar?: string, lvlbarBg?: string}} style
 */
async function renderRankCard({ user, guildName, level, xp, reqxp, rank }, style) {
	const Canvas = require("@napi-rs/canvas");
	const font = useFont(Canvas);

	const accent = style.color || DEFAULT_ACCENT;
	const barFill = style.lvlbar || "#ffffff";
	const barBackground = style.lvlbarBg || "#ffffff";

	const canvas = Canvas.createCanvas(WIDTH, HEIGHT);
	const ctx = canvas.getContext("2d");

	roundedBox(ctx, 0, 0, WIDTH, HEIGHT, CORNER_RADIUS);
	ctx.save();
	ctx.clip();
	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, WIDTH, HEIGHT);
	const background = await Canvas.loadImage(style.background || DEFAULT_BACKGROUND);
	ctx.globalAlpha = 0.7;
	const scaledHeight = background.height * (WIDTH / background.width);
	ctx.drawImage(background, 0, (HEIGHT - scaledHeight) / 2, WIDTH, scaledHeight);
	ctx.restore();

	ctx.fillStyle = "#000000";
	ctx.globalAlpha = 0.4;
	ctx.fillRect(40, 0, 240, HEIGHT);
	ctx.globalAlpha = 1;

	const avatar = await Canvas.loadImage(user.displayAvatarURL());
	ctx.save();
	roundedBox(ctx, 70, 30, 180, 180, 50);
	ctx.strokeStyle = accent;
	ctx.lineWidth = 15;
	ctx.stroke();
	ctx.clip();
	ctx.drawImage(avatar, 70, 30, 180, 180);
	ctx.restore();

	drawStatBadge(ctx, font, accent, 70, 320, shortener(xp) + " XP");
	drawStatBadge(ctx, font, accent, 70, 240, `Level ${shortener(level)}`);

	const noSymbols = (text) => text.replace(/[\x7f\P{ASCII}]/gu, "");
	drawShadowedText(ctx, font, noSymbols(user.tag), CONTENT_X, 80, 39, "left");
	drawShadowedText(ctx, font, "#" + rank, WIDTH - 55, 80, 55, "right");

	paintInRoundedBox(ctx, GUILD_BOX, () => {
		ctx.fillStyle = "#ffffff";
		ctx.font = font(guildNameFontSize(guildName));
		ctx.textAlign = "center";
		ctx.fillText(guildName, GUILD_BOX.x + GUILD_BOX.width / 2, GUILD_BOX.y + 50);
		ctx.globalAlpha = 0.2;
		fillBox(ctx, GUILD_BOX);
	});

	paintInRoundedBox(ctx, BAR_BOX, () => {
		ctx.fillStyle = barBackground;
		ctx.globalAlpha = 0.2;
		fillBox(ctx, BAR_BOX);
	});

	const progressBox = { ...BAR_BOX, width: (xp / reqxp) * BAR_BOX.width };
	paintInRoundedBox(ctx, progressBox, () => {
		ctx.fillStyle = barFill;
		ctx.globalAlpha = 0.5;
		fillBox(ctx, progressBox);
	});

	ctx.save();
	ctx.textAlign = "left";
	ctx.fillStyle = "#ffffff";
	ctx.globalAlpha = 0.8;
	ctx.font = font(30);
	ctx.fillText("Next Level: " + shortener(reqxp) + " XP", CONTENT_X, 230);
	ctx.restore();

	ctx.textAlign = "center";
	ctx.fillStyle = "#474747";
	ctx.font = font(30);
	ctx.fillText(`${shortener(xp)}/${shortener(reqxp)}`, 730, 180);

	return {
		attachment: canvas.toBuffer("image/webp"),
		description: "Rank Card",
		name: "rank.png"
	};
}

module.exports = renderRankCard;
