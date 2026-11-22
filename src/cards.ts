import { registerCardFonts, registerFont } from "./functions/utilities";
import { convertFrom } from "./functions/curve";
import type { Image, SKRSContext2D } from "@napi-rs/canvas";
import { encodeWebp, loadCanvas, loadImage } from "./functions/canvas";
import { findOrCreateUser, positionOf } from "./functions/users";
import { CARD_FONT, dynamicFont, FALLBACK_FONT, RoundedBox, SECONDARY_FONT, strokedText } from "./functions/draw";
import { hasFields, optionsOf, requireIds, requireValue } from "./functions/guards";
import { renderCleanup } from "./functions/renderCleanup";
import { XpFatal, XpLog } from "./functions/xplogs";
import type { UserResult } from "./classes/Database";
import type { User } from "./client";

export type CompareCardLocales = {
	level?: string;
	versus?: string;
}

type HexColor = `#${string}` | `0x${string}`;

/**
 * @property {URL} background - Background image URL
 * @property {HexColor} color - Avatar border color
 * @property {HexColor} centerBar - Center bar color
 * @property {HexColor} centerBarBg - Center bar background color
 * @property {string} font - ABSOLUTE FILE PATH
 * @property {boolean} light - Use light theme
 */
export interface CompareCardOptions {
	background?: URL;
	color?: HexColor;
	centerBar?: HexColor;
	centerBarBg?: HexColor;
	fallbackFont?: string;
	font?: string;
	light?: boolean;
}

export type LeaderboardCardLocales = {
	level?: string;
	members?: string;
}

/**
 * @property {[HexColor, HexColor]} artworkColors - Gradient colors
 * @property {URL} artworkImage
 * @property {[HexColor, HexColor]} borderColors - Gradient colors
 * @property {HexColor} backgroundColor
 * @property {URL} backgroundImage
 * @property {string} primaryFont - ABSOLUTE FILE PATH
 * @property {boolean} light - Use light theme
 * @property {[HexColor, HexColor]} rowColors - Even & Odd row colors
 * @property {number} rowOpacity
 * @property {string} secondaryFont - ABSOLUTE FILE PATH
 */
export interface LeaderboardCardOptions {
	artworkColors?: [HexColor, HexColor];
	artworkImage?: URL;
	borderColors?: [HexColor, HexColor];
	backgroundColor?: HexColor;
	backgroundImage?: URL;
	fallbackFont?: string;
	light?: boolean;
	primaryFont?: string;
	rowColors?: [HexColor, HexColor];
	rowOpacity?: number;
	secondaryFont?: string;
}

export type RankCardLocales = {
	level?: string;
	next_level?: string;
	xp?: string;
}

/**
 * @property {URL} background - Background image URL
 * @property {HexColor} color - Avatar border color
 * @property {boolean} legacy - Use legacy card design
 * @property {HexColor} lvlbar
 * @property {HexColor} lvlbarBg
 * @property {string} font - ABSOLUTE FILE PATH
 */
export interface RankCardOptions {
	background?: URL;
	color?: HexColor;
	legacy?: boolean;
	light?: boolean;
	lvlbar?: HexColor;
	lvlbarBg?: HexColor;
	fallbackFont?: string;
	font?: string;
}

export type CardUserOptions = {
	id: string;
	username: string;
	avatarURL: string;
}

/**
 * Generate a simple comparison card
 * @async
 * @param {{id: string, name: string}} guild - (id, name)
 * @param {CardUserOptions} user1 - User 1
 * @param {CardUserOptions} user2 - User 2
 * @param {CompareCardOptions?} options - (background, color, centerBar, centerBarBg, light, font, fallbackFont)
 * @param {CompareCardLocales?} locales - [BETA] Translate the comparison card (level, versus)
 * @link `Documentation` https://simplyxp.js.org/docs/functions/compareCard
 * @returns {Promise<{attachment: Buffer, description: string, name: string}>}
 * @throws {XpFatal} - If parameters are not provided correctly or if the user is not found in the database
 */
export async function compareCard(guild: {
	id: string,
	name: string
}, user1: CardUserOptions, user2: CardUserOptions, options: CompareCardOptions = {}, locales: CompareCardLocales = {}): Promise<{
	attachment: Buffer;
	description: string;
	name: string;
}> {
	if (!hasFields(guild, "id", "name")) throw new XpFatal({ function: "compareCard()", message: "Please provide a guild" });
	if (!hasFields(user1, "id", "username") || !hasFields(user2, "id", "username")) throw new XpFatal({
		function: "compareCard()",
		message: "Please provide two valid users!"
	});
	requireIds("compareCard()", user1.id, guild.id);
	requireIds("compareCard()", user2.id, guild.id);

	const opts = optionsOf(options);
	const labels = { level: optionsOf(locales).level || "Level", versus: optionsOf(locales).versus || "vs" };

	try {
		await registerCardFonts(opts.font, opts.fallbackFont);

		const compareImage = await loadImage(opts.background || "https://i.ibb.co/WnfXZjc/clouds.jpg").catch(() => {
			throw new XpFatal({
				function: "compareCard()", message: "Unable to load background image, is it valid and reachable?"
			});
		});

		const avatar1 = await loadImage(user1.avatarURL).catch(() => {
			throw new XpFatal({
				function: "compareCard()", message: "[USER 1] Unable to load user's AvatarURL, is it valid and reachable?"
			});
		});

		const avatar2 = await loadImage(user2.avatarURL).catch(() => {
			throw new XpFatal({
				function: "compareCard()", message: "[USER 2] Unable to load user's AvatarURL, is it valid and reachable?"
			});
		});

		const dbUser1 = await findOrCreateUser(guild.id, user1.id, user1.username);
		if (!dbUser1) throw new XpFatal({ function: "compareCard()", message: "[USER 1] User not found in database" });

		const dbUser2 = await findOrCreateUser(guild.id, user2.id, user2.username);
		if (!dbUser2) throw new XpFatal({ function: "compareCard()", message: "[USER 2] User not found in database" });

		const canvas = (await loadCanvas()).createCanvas(1080, 400);
		const context = canvas.getContext("2d");

		RoundedBox(context, 0, 0, canvas.width, canvas.height, 25);
		context.clip();

		context.fillStyle = (opts.light ? "#ffffff" : "#000000");
		context.fill();
		context.globalAlpha = 0.6;

		context.drawImage(compareImage, -5, 0, 1090, 400);
		context.restore();

		context.globalAlpha = 1;

		const cardBoxColor = opts.color || (opts.light ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)"),
			barFill = opts.centerBar || (opts.light ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.65)"),
			barBg = opts.centerBarBg || (opts.light ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)"),
			softStroke = "rgba(0,0,0,0.5)",
			textColor = "#ffffff";

		drawCompareUser(context, 160, {
			avatar: avatar1, levelText: labels.level + ` ${shortener(dbUser1.level, true)}`, name: user1.username, xpText: `${shortener(dbUser1.xp)} XP`
		}, { boxColor: cardBoxColor, light: Boolean(opts.light) });
		drawCompareUser(context, 920, {
			avatar: avatar2, levelText: labels.level + ` ${shortener(dbUser2.level, true)}`, name: user2.username, xpText: `${shortener(dbUser2.xp)} XP`
		}, { boxColor: cardBoxColor, light: Boolean(opts.light) });

		strokedText(context, labels.versus, 540, 208, { font: `64px ${CARD_FONT}`, lineWidth: 5, stroke: softStroke });

		const barX = 290, barY = 350, barW = 500, barH = 22;
		const totalXP = dbUser1.xp + dbUser2.xp;
		const user1Fill = totalXP > 0 ? Math.round((dbUser1.xp / totalXP) * barW) : Math.round(barW / 2);

		context.save();
		RoundedBox(context, barX, barY, barW, barH, 8, { clip: true, fill: { color: barBg } });
		context.restore();

		if (user1Fill > 0) {
			context.save();
			RoundedBox(context, barX, barY, user1Fill, barH, 8, { clip: true, fill: { color: barFill } });
			context.restore();
		}

		const levelDiff = dbUser1.level - dbUser2.level;
		const diffText = levelDiff > 0 ? `+${levelDiff}` : levelDiff < 0 ? `${levelDiff}` : "=";

		strokedText(context, diffText, 540, barY + 15, { fill: textColor, font: `16px ${CARD_FONT}`, lineWidth: 4, stroke: softStroke });

		return {
			attachment: await encodeWebp(canvas),
			description: `${user1.username} (Lvl ${dbUser1.level}) vs ${user2.username} (Lvl ${dbUser2.level}) in ${guild.name}`.slice(0, 200),
			name: "compareCard.webp"
		};
	} finally {
		renderCleanup("compareCard()", "card rendering");
	}
}

function drawCompareUser(
	context: SKRSContext2D,
	x: number,
	user: { avatar: Image; levelText: string; name: string; xpText: string },
	style: { boxColor: string; light: boolean }
): void {
	strokedText(context, user.name, x, 50, { font: `32px ${CARD_FONT}`, lineWidth: 5, maxWidth: 280, stroke: "rgba(0,0,0,0.5)" });

	context.save();
	context.beginPath();
	context.arc(x, 195, 100, 0, Math.PI * 2);
	context.closePath();
	context.clip();
	context.fillStyle = style.boxColor;
	context.fill();
	context.drawImage(user.avatar, x - 110, 85, 220, 220);
	context.restore();

	context.save();
	context.beginPath();
	context.arc(x, 195, 105, 0, Math.PI * 2);
	context.closePath();
	context.strokeStyle = style.boxColor;
	context.lineWidth = 5;
	context.stroke();
	context.restore();

	strokedText(context, user.levelText, x, 342, { font: `25px ${CARD_FONT}`, lineWidth: 5, stroke: "rgba(0,0,0,0.5)" });

	context.save();
	context.textAlign = "center";
	context.font = `18px ${CARD_FONT}`;
	context.fillStyle = style.light ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";
	context.fillText(user.xpText, x, 366);
	context.restore();
}

/**
 * Generate a simple leaderboard card
 * @async
 * @param {Array<User>} data - Array of user data
 * @param {LeaderboardCardOptions?} options - (artworkColor, artworkImage, light)
 * @param {{name: string, imageURL: string, memberCount: number}?} guildInfo - Guild info
 * @param {LeaderboardCardLocales?} locales - Locales
 * @link `Documentation` https://simplyxp.js.org/docs/functions/leaderboard
 * @returns {Promise<{attachment: Buffer, description: string, name: string}>}
 * @throws {XpFatal} - If parameters are not provided correctly
 */
export async function leaderboardCard(data: Array<User>, options: LeaderboardCardOptions = {}, guildInfo?: {
	name: string, imageURL: string, memberCount?: number
}, locales: LeaderboardCardLocales = {}): Promise<{ attachment: Buffer; description: string; name: string; }> {
	if (!Array.isArray(data) || data.length < 1) throw new XpFatal({
		function: "leaderboardCard()", message: "There must be at least 1 user in the data array"
	});

	const opts = optionsOf(options);
	const labels = { level: optionsOf(locales).level || "LEVEL", members: optionsOf(locales).members || "Members" };

	try {
		let artworkImage: Image | undefined = undefined, backgroundImage: Image | undefined = undefined, colors;

		if (opts.artworkImage) artworkImage = await loadImage(opts.artworkImage).catch(() => {
			throw new XpFatal({
				function: "leaderboardCard()", message: "Unable to load artwork image, is it valid?"
			});
		});

		if (opts.backgroundImage) backgroundImage = await loadImage(opts.backgroundImage).catch(() => {
			throw new XpFatal({
				function: "leaderboardCard()", message: "Unable to load background image, is it valid?"
			});
		});

		await registerCardFonts(opts.primaryFont, opts.fallbackFont);
		if (opts.secondaryFont) await registerFont(opts.secondaryFont, SECONDARY_FONT);

		const rows = data.slice(0, 8);
		const font = opts.secondaryFont ? `${SECONDARY_FONT}, ${FALLBACK_FONT}` : CARD_FONT;

		if (opts.light) {
			colors = {
				artworkColors: opts.artworkColors || ["#997fe1", "#616bff"],
				backgroundColor: "#FFFFFF",
				borderColors: opts.borderColors || ["#e0d440", "#fffa6b"],
				evenColor: opts.rowColors?.[0] || "#f0f0f0",
				oddColor: opts.rowColors?.[1] || "#dcdcdc",
				primaryTextColor: "#000000",
				secondaryTextColor: "rgba(0,0,0,0.5)"
			};
		} else colors = {
			artworkColors: opts.artworkColors || ["#6B46D4", "#2e3cff"],
			backgroundColor: "#141414",
			borderColors: opts.borderColors || ["#e0d440", "#fffa6b"],
			evenColor: opts.rowColors?.[0] || "#1e1e1e",
			oddColor: opts.rowColors?.[1] || "#282828",
			primaryTextColor: "#ffffff",
			secondaryTextColor: "rgba(255,255,255,0.5)"
		};

		const canvas = (await loadCanvas()).createCanvas(1350, 1080);
		const context = canvas.getContext("2d");

		RoundedBox(context, 0, 0, canvas.width, canvas.height, 20, { clip: true });


		const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
		gradient.addColorStop(0.4, colors.artworkColors[0]);
		gradient.addColorStop(1, colors.artworkColors[1]);
		context.fillStyle = gradient;
		context.fillRect(0, 0, canvas.width, 220);

		if (artworkImage) {
			context.fillStyle = "#000000";
			context.fillRect(0, 0, canvas.width, 220);
			context.globalAlpha = 0.5;
			context.drawImage(artworkImage, 0, 0, canvas.width, 220);
			context.globalAlpha = 1;
		}

		context.fillStyle = opts.backgroundColor || colors.backgroundColor;
		context.fillRect(0, 220, canvas.width, 1080);

		if (backgroundImage) {
			context.globalAlpha = 0.9;
			context.drawImage(backgroundImage, 0, 220, canvas.width, 1080);
			context.globalAlpha = 1;
		}

		if (guildInfo?.imageURL && guildInfo.name) {
			const guildIcon = await loadImage(guildInfo.imageURL).catch(() => null);
			if (guildIcon) {
				context.save();
				context.beginPath();
				context.arc(150, 110, 90, 0, Math.PI * 2, true);
				context.closePath();
				context.clip();
				context.drawImage(guildIcon, 60, 20, 180, 180);
				context.restore();

				const gradientBorder = context.createLinearGradient(0, 0, 0, 220);
				gradientBorder.addColorStop(0, colors.borderColors[0]);
				gradientBorder.addColorStop(1, colors.borderColors[1]);
				context.strokeStyle = gradientBorder;
				context.lineWidth = 8;
				context.beginPath();
				context.arc(150, 110, 90, 0, Math.PI * 2, true);
				context.stroke();
			}

			context.fillStyle = colors.primaryTextColor;
			context.font = `60px ${CARD_FONT}`;

			if (!guildInfo.memberCount) {
				context.fillText(guildInfo.name, 270, 130);
			} else {
				context.fillText(guildInfo.name, 270, 110);

				context.fillStyle = colors.secondaryTextColor;
				context.font = `40px ${CARD_FONT}`;
				context.fillText(`${guildInfo.memberCount} ${labels.members}`, 270, 160);
			}
		}

		let currentCardColor = colors.evenColor;
		const defaultRowOpacity = backgroundImage ? 0.5 : 1;
		const configuredOpacity = typeof opts.rowOpacity === "number" && Number.isFinite(opts.rowOpacity) ? opts.rowOpacity : defaultRowOpacity;
		const rowOpacity = Math.min(1, Math.max(0, configuredOpacity));
		for (const [i, row] of rows.entries()) {
			const cardY = 300 + (i * 90);
			context.globalAlpha = rowOpacity;

			context.save();
			if (rows.length === 1) {
				RoundedBox(context, 30, cardY, 1290, 90, 20, { clip: true, fill: { color: currentCardColor } });
			} else {
				if (i === 0) {
					RoundedBox(context, 30, cardY, 1290, 90, 20, {
						clip: true, fill: { color: currentCardColor }, roundCorners: { top: true, bottom: false }
					});
				} else if (i === rows.length - 1) {
					RoundedBox(context, 30, cardY, 1290, 90, 20, {
						clip: true, fill: { color: currentCardColor }, roundCorners: { top: false, bottom: true }
					});
				} else {
					RoundedBox(context, 30, cardY, 1290, 90, 0, { fill: { color: currentCardColor } });
				}
			}
			context.restore();

			context.globalAlpha = 1;

			context.textAlign = "left";
			context.font = `30px ${font}`;
			context.fillStyle = colors.secondaryTextColor;
			context.fillText(`${i + 1}.`, 60, cardY + 55);

			context.textAlign = "left";
			context.font = `40px ${font}`;
			context.fillStyle = colors.primaryTextColor;
			context.fillText(row.name || row.user || "???", 120, cardY + 60);

			context.textAlign = "right";
			context.font = `30px ${font}`;
			context.fillStyle = colors.primaryTextColor;
			const levelText = shortener(row.level);
			context.fillText(levelText, 1270, cardY + 55);
			context.fillStyle = colors.secondaryTextColor;
			context.fillText(labels.level, 1270 - context.measureText(levelText).width - 15, cardY + 55);

			currentCardColor = currentCardColor === colors.evenColor ? colors.oddColor : colors.evenColor;
		}

		return {
			attachment: await encodeWebp(canvas),
			description: `${guildInfo?.name ? `${guildInfo.name} leaderboard` : "Leaderboard"} — Top ${rows.length} user${rows.length !== 1 ? "s" : ""}`.slice(0, 200),
			name: "leaderboard.webp"
		};
	} finally {
		renderCleanup("leaderboardCard()", "card rendering");
	}
}

/**
 * Generate a simple user rank card
 * @async
 * @param {{id: string, name: string}} guild - (id, name)
 * @param {CardUserOptions} user - (id, username, avatarURL)
 * @param {RankCardOptions?} options - (background, color, legacy, lvlbar, lvlbarBg, font)
 * @param {RankCardLocales?} locales - [BETA] Translate the rank card
 * @link `Documentation` https://simplyxp.js.org/docs/functions/rankCard
 * @returns {Promise<{attachment: Buffer, description: string, name: string}>}
 * @throws {XpFatal} - If parameters are not provided correctly
 */
export async function rankCard(guild: {
	id: string,
	name: string
}, user: CardUserOptions, options: RankCardOptions = {}, locales: RankCardLocales = {}): Promise<{
	attachment: Buffer;
	description: string;
	name: string;
}> {
	requireValue("rankCard()", guild, "No Guild Provided");
	requireValue("rankCard()", user, "No User Provided");

	const opts = optionsOf(options);
	const translations = optionsOf(locales);
	const labels = {
		level: translations.level || "Level",
		next_level: translations.next_level || "Next Level",
		xp: translations.xp || "XP"
	};

	XpLog.debug("rankCard()", `${opts.legacy ? "LEGACY" : "MODERN"} ENABLED`);

	if (!hasFields(user, "id", "username")) {
		throw new XpFatal({
			function: "rankCard()", message: "Invalid User Provided, user must contain id, username, and avatarURL."
		});
	}
	requireIds("rankCard()", user.id, guild.id);

	try {
		await registerCardFonts(opts.font, opts.fallbackFont);

		const rankImage = await loadImage(opts.background || (opts.legacy ? "https://i.ibb.co/dck2Tnt/rank-card.webp" : "https://i.ibb.co/WnfXZjc/clouds.jpg")).catch(() => {
			throw new XpFatal({
				function: "rankCard()", message: "Unable to load background image, is it valid and reachable?"
			});
		});

		const avatarURL = await loadImage(user.avatarURL).catch(() => {
			throw new XpFatal({
				function: "rankCard()", message: "Unable to load user's AvatarURL, is it valid and reachable??"
			});
		});

		const dbUser: UserResult | null = await findOrCreateUser(guild.id, user.id, user.username);
		if (!dbUser) throw new XpFatal({ function: "rankCard()", message: "User not found in database" });

		const position = await positionOf(guild.id, dbUser.xp);

		const canvas = (await loadCanvas()).createCanvas(1080, 400);
		const context = canvas.getContext("2d");

		context.save();
		RoundedBox(context, 0, 0, canvas.width, canvas.height, 25);
		context.clip();

		context.fillStyle = (opts.light ? "#ffffff" : "#000000");
		context.fill();
		context.globalAlpha = (opts.legacy ? 0.8 : 0.6);

		context.drawImage(rankImage, -5, 0, 1090, 400);
		context.restore();


		const rankBoxColor = opts.color || (opts.legacy ? "#9900ff" : (opts.light ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)")),
			LevelBarFill = opts.lvlbar || "#ffffff",
			LevelBarBackground = opts.lvlbarBg || (opts.legacy ? "#FFFFFF" : (opts.light ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)")),
			TextEXP = shortener(dbUser.xp) + ` ${labels.xp}`,
			LvlText = labels.level + ` ${shortener(dbUser.level)}`,
			nextLevelXP = convertFrom(dbUser.level + 1),
			currentLevelXP = convertFrom(dbUser.level),
			progressDenominator = Math.max(1, nextLevelXP - currentLevelXP),
			progressRatio = Math.min(1, Math.max(0, (dbUser.xp - currentLevelXP) / progressDenominator)),
			progressWidth = opts.legacy ? 660 : 530,
			progress = progressRatio * progressWidth,
			positionColour = resolvePositionColor(position, dbUser.user);


		if (!opts.legacy) {

			strokedText(context, user.username, 540, 80, { font: `40px ${CARD_FONT}`, lineWidth: 7, stroke: "rgba(0,0,0,0.35)" });


			context.save();
			context.beginPath();
			context.arc(160, 200, 100, 0, Math.PI * 2);
			context.closePath();
			context.clip();
			context.fillStyle = rankBoxColor;
			context.fill();
			context.drawImage(avatarURL, 50, 90, 220, 220);
			context.restore();

			context.save();
			context.beginPath();
			context.arc(160, 200, 105, 0, Math.PI * 2);
			context.closePath();
			context.strokeStyle = rankBoxColor;
			context.lineWidth = 5;
			context.stroke();
			context.restore();

			context.save();
			context.beginPath();
			context.arc(230, 130, 28, 0, Math.PI * 2);
			context.closePath();
			context.clip();
			context.fillStyle = positionColour;
			context.fill();

			context.fillStyle = "#000000";
			dynamicFont(context, shortener(position, true), 230, 138, 45, 30);
			context.restore();

			context.save();
			context.beginPath();
			context.arc(230, 130, 30, 0, Math.PI * 2);
			context.closePath();
			context.strokeStyle = rankBoxColor;
			context.lineWidth = 5;
			context.stroke();
			context.restore();

			strokedText(context, LvlText, 160, 350, { font: `25px ${CARD_FONT}`, lineWidth: 5, stroke: "rgba(0,0,0,0.35)" });

			context.save();
			RoundedBox(context, 265, 330, 540, 25, 10, {
				clip: true, fill: { color: LevelBarBackground }
			});
			RoundedBox(context, 270, 335, progress, 15, 5, {
				clip: true, fill: { color: LevelBarFill }
			});
			context.restore();

			context.save();
			context.textAlign = "center";
			context.font = `22px ${CARD_FONT}`;
			context.fillStyle = opts.light
				? "rgba(0,0,0,0.6)"
				: "rgba(255,255,255,0.6)";
			context.fillText(
				`${shortener(dbUser.xp)} / ${shortener(nextLevelXP)}`,
				540,
				320
			);
			context.restore();

			strokedText(context, `${labels.level} ` + shortener(dbUser.level + 1), 920, 350, {
				font: `25px ${CARD_FONT}`, lineWidth: 5, stroke: "rgba(0,0,0,0.35)"
			});

		} else {

			context.save();
			context.globalAlpha = 0.4;
			context.fillStyle = opts.light ? "#ffffff" : "#000000";
			context.fillRect(40, 0, 240, canvas.height);
			context.restore();

			context.save();
			RoundedBox(context, 70, 30, 180, 180, 50, { clip: true, fill: { color: rankBoxColor } });
			RoundedBox(context, 75, 35, 170, 170, 50, { clip: true });
			context.drawImage(avatarURL, 70, 30, 180, 180);
			context.restore();

			context.save();
			RoundedBox(context, 70, 320, 180, 50, 20, { clip: true });
			context.fillStyle = rankBoxColor;
			context.fillRect(70, 320, 180, 50);
			context.fillStyle = "#ffffff";
			dynamicFont(context, TextEXP, 160, 355, 160, 32);
			context.restore();

			context.save();
			RoundedBox(context, 70, 240, 180, 50, 20, { clip: true });
			context.fillStyle = rankBoxColor;
			context.fillRect(70, 240, 180, 50);
			context.fillStyle = "#ffffff";
			context.textAlign = "center";
			dynamicFont(context, LvlText, 160, 275, 160, 32);
			context.restore();

			strokedText(context, user.username, 395, 80, { align: "left", font: `39px ${CARD_FONT}`, lineWidth: 5, stroke: "rgba(0,0,0,0.35)" });

			strokedText(context, "#" + position, canvas.width - 55, 80, {
				align: "right", font: `55px ${CARD_FONT}`, lineWidth: 7, stroke: "rgba(0,0,0,0.35)"
			});

			context.save();
			RoundedBox(context, 390, 305, 660, 70, 20, { clip: true });
			context.globalAlpha = 0.2;
			context.fillStyle = "#ffffff";
			context.fillRect(390, 305, 660, 70);
			context.globalAlpha = 1;
			dynamicFont(context, guild.name, 720, 355, 700, 45);
			context.restore();

			context.save();
			RoundedBox(context, 390, 145, 660, 50, 20, { clip: true });
			context.globalAlpha = 0.2;
			context.fillStyle = LevelBarBackground;
			context.fillRect(390, 145, 660, 50);
			context.restore();

			context.save();
			RoundedBox(context, 390, 145, progress, 50, 20, { clip: true });
			context.globalAlpha = 0.5;
			context.fillStyle = LevelBarFill;
			context.fillRect(390, 145, progress, 50);
			context.restore();

			context.save();
			context.textAlign = "left";
			context.font = `30px ${CARD_FONT}`;
			context.fillStyle = "#ffffff";
			context.globalAlpha = 0.8;
			context.fillText(`${labels.next_level}: ${shortener(nextLevelXP)} ${labels.xp}`, 390, 230);
			context.restore();

			context.textAlign = "center";
			context.font = `30px ${CARD_FONT}`;
			context.fillStyle = "#474747";
			context.globalAlpha = 1;
			const textXPEdited = `${shortener(dbUser.xp)} / ${shortener(nextLevelXP)}`;
			context.fillText(textXPEdited, 730, 180);
		}

		return {
			attachment: await encodeWebp(canvas),
			description: `${user.username}'s rank card — Lvl ${dbUser.level} | ${shortener(dbUser.xp)} XP | #${position} in ${guild.name}`.slice(0, 200),
			name: "rank.webp"
		};
	} finally {
		renderCleanup("rankCard()", "card rendering");
	}
}

function resolvePositionColor(position: number, userId: string): string {
	if (userId === "326815959358898189") return "#ade6d8";
	if (position === 1) return "#ADD8E6";
	if (position === 2) return "#C0C0C0";
	if (position === 3) return "#CD7F32";
	return "#ffffff";
}

const SUFFIXES = ["", "K", "M", "B", "T", "Qa"];

function shortener(count: number | undefined, roundedNumber?: boolean): string {
	if (!count || count > Number.MAX_SAFE_INTEGER) return count ? "∞" : "0";

	let value = count;
	for (const [i, suffix] of SUFFIXES.entries()) {
		if (value < 1000) return `${value.toFixed(i === 0 || roundedNumber ? 0 : 2)}${suffix}`;
		value /= 1000;
	}

	return "∞";
}
