import {Canvas, createCanvas, GlobalFonts, Image, loadImage, SKRSContext2D} from "@napi-rs/canvas";
import {XpFatal, XpLog} from "./functions/xplogs";
import {db} from "./functions/database";
import {User} from "./leaderboard";
import {convertFrom} from "./functions/utilities";
import {join} from "path";
import {create, xp} from "../xp";

type HexColor = `#${string}` | `0x${string}`;

let cachedRankImage: Image | null, cachedRankCanvas: Canvas | null, cachedRankContext: SKRSContext2D | null;
let cachedLeaderboardArtwork: Image | null,
	cachedLeaderboardCanvas: Canvas | null,
	cachedLeaderboardContext: SKRSContext2D | null,
	cachedLeaderboardImage: Image | null;

/**
 * @property {[HexColor, HexColor]} artworkColors - Gradient colors
 * @property {URL} artworkImage
 * @property {[HexColor, HexColor]} borderColors - Gradient colors
 * @property {HexColor} backgroundColor
 * @property {URL} backgroundImage
 * @property {string} font - ABSOLUTE FILE PATH
 * @property {boolean} light - Use light theme
 */
export interface LeaderboardOptions {
	artworkColors?: [HexColor, HexColor];
	artworkImage?: URL;
	borderColors?: [HexColor, HexColor];
	backgroundColor?: HexColor;
	backgroundImage?: URL;
	font?: string;
	light?: boolean;
}

/**
 * @property {URL} background - Background image URL
 * @property {HexColor} color
 * @property {boolean} legacy - Use legacy card design
 * @property {HexColor} lvlbar
 * @property {HexColor} lvlbarBg
 * @property {string} font - ABSOLUTE FILE PATH
 */
export interface RankCardOptions {
	background?: URL;
	color?: HexColor;
	legacy?: boolean;
	lvlbar?: HexColor;
	lvlbarBg?: HexColor;
	font?: string;
}

export type UserOptions = {
	id: string;
	username: string;
	avatarURL: string;
}

export type LeaderboardLocales = {
	level?: string;
	members?: string;
}

export type rankLocales = {
	level?: string;
	next_level?: string;
	xp?: string;
}

/**
 * Generate a simple user rank card
 * @async
 * @param {{id: string, name: string}} guild - (id, name)
 * @param {UserOptions} user - (id, username, avatarURL)
 * @param {RankCardOptions?} options - (background, color, legacy, lvlbar, lvlbarBg, font)
 * @param {rankLocales?} locales - [BETA] Translate the rank card
 * @link [Documentation](https://simplyxp.js.org/docs/rankCard)
 * @returns {Promise<{attachment: Buffer, description: string, name: string}>}
 * @throws {XpFatal} - If parameters are not provided correctly
 */
export async function rankCard(guild: { id: string, name: string }, user: UserOptions, options: RankCardOptions = {}, locales: rankLocales = {}): Promise<{ attachment: Buffer; description: string; name: string; }> {
	if (!guild) throw new XpFatal({function: "rankCard()", message: "No Guild Provided"});
	if (!user) throw new XpFatal({function: "rankCard()", message: "No User Provided"});

	// TODO: Add support for modern mode
	options.legacy = true;
	let canvas: Canvas, context: SKRSContext2D;

	if (!locales?.level) locales.level = "Level";
	if (!locales?.next_level) locales.next_level = "Next Level";
	if (!locales?.xp) locales.xp = "XP";

	XpLog.debug("rankCard()", "LEGACY MODE ENABLED");
	XpLog.info("rankCard()", "Modern RankCard is not supported yet, coming soon!");

	if (!user?.avatarURL.endsWith(".png") && !user.avatarURL.endsWith(".jpg") && !user.avatarURL.endsWith(".webp")) {
		throw new XpFatal({
			function: "rankCard()", message: "Invalid avatar image, avatar image must be a png, jpg, or webp"
		});
	}

	// check if user.id and user.username and user.displayAvatarURL() exists
	if (!user || !user.id || !user.username) {
		throw new XpFatal({
			function: "rankCard()", message: "Invalid User Provided, user must contain id, username, and avatarURL."
		});
	}

	GlobalFonts.registerFromPath(options?.font || join(__dirname, "Fonts", "Baloo-Regular.eot"), "Sans Serif");

	if (!cachedRankImage) cachedRankImage = await loadImage(options?.background || "https://i.ibb.co/dck2Tnt/rank-card.webp");

	let dbUser = await db.findOne({collection: "simply-xps", data: {guild: guild.id, user: user.id}}) as User;
	if (!dbUser) {
		if (xp.auto_create) dbUser = await create(guild.id, user.id, user.username);
		else throw new XpFatal({function: "rankCard()", message: "User not found in database"});
	}

	const users = await db.find({collection: "simply-xps", data: {guild: guild.id}}) as User[];

	const position: number = users.sort((a, b) => b.xp - a.xp).findIndex((u) => u.user === user.id) + 1;

	if (options?.legacy) {
		const Username = user.username.replace(/[\u007f-\uffff]/g, ""),
			BoxColor = options?.color || "#9900ff",
			LevelBarFill = options?.lvlbar || "#ffffff",
			LevelBarBackground = options?.lvlbarBg || "#ffffff",
			TextEXP = shortener(dbUser.xp) + ` ${locales.xp}`,
			LvlText = locales.level + ` ${shortener(dbUser.level)}`,
			TextXpNeeded = "{current} / {needed}",
			nextLevelXP = convertFrom(dbUser.level + 1),
			currentLevelXP = convertFrom(dbUser.level),
			progress = (((100 * (dbUser.xp - currentLevelXP)) / (nextLevelXP - currentLevelXP)) * 660) / 100;


		if (!cachedRankContext || !cachedRankCanvas) {
			canvas = createCanvas(1080, 400);
			context = canvas.getContext("2d");

			RoundedBox(context, 0, 0, canvas.width, canvas.height, 50);
			context.clip();

			context.fillStyle = "#000000";
			context.fillRect(0, 0, 1080, 400);

			context.globalAlpha = 0.7;
			context.drawImage(cachedRankImage, -5, 0, 1090, 400);
			context.restore();

			context.fillStyle = "#000000";
			context.globalAlpha = 0.4;
			context.fillRect(40, 0, 240, canvas.height);
			context.globalAlpha = 1;
		} else {
			canvas = cachedRankCanvas;
			context = cachedRankContext;
		}

		context.save();
		RoundedBox(context, 70, 30, 180, 180, 50);
		context.strokeStyle = BoxColor;
		context.lineWidth = 15;
		context.stroke();
		context.clip();
		context.drawImage(await loadImage(user.avatarURL), 70, 30, 180, 180);
		context.restore();

		context.save();
		RoundedBox(context, 70, 240 + 50 + 30, 180, 50, 20);
		context.strokeStyle = "#BFC85A22";
		context.stroke();
		context.clip();
		context.fillStyle = BoxColor;
		context.globalAlpha = 1;
		context.fillRect(70, 320, 180, 50);
		context.globalAlpha = 1;
		context.fillStyle = "#ffffff";
		context.textAlign = "center";
		dynamicFont(context, TextEXP, 160, 358, 160, 32);
		context.restore();

		context.save();
		RoundedBox(context, 70, 240, 180, 50, 20);
		context.strokeStyle = "#BFC85A22";
		context.stroke();
		context.clip();
		context.fillStyle = BoxColor;
		context.globalAlpha = 1;
		context.fillRect(70, 240, 180, 50);
		context.globalAlpha = 1;
		context.fillStyle = "#ffffff";
		context.textAlign = "center";
		dynamicFont(context, LvlText, 160, 278, 160, 32);
		context.restore();

		context.save();
		context.textAlign = "left";
		context.fillStyle = "#ffffff";
		context.shadowColor = "#000000";
		context.shadowBlur = 15;
		context.shadowOffsetX = 1;
		context.shadowOffsetY = 1;
		context.font = "39px \"Sans Serif\"";
		context.fillText(Username, 390, 80);
		context.restore();

		context.save();
		context.textAlign = "right";
		context.fillStyle = "#ffffff";
		context.shadowColor = "#000000";
		context.shadowBlur = 15;
		context.shadowOffsetX = 1;
		context.shadowOffsetY = 1;
		context.font = "55px \"Sans Serif\"";
		context.fillText("#" + position, canvas.width - 55, 80);
		context.restore();

		context.save();
		RoundedBox(context, 390, 305, 660, 70, Number(20));
		context.strokeStyle = "#BFC85A22";
		context.stroke();
		context.clip();
		context.fillStyle = "#ffffff";
		context.textAlign = "center";
		dynamicFont(context, guild.name, 720, 355, 700, 45);
		context.globalAlpha = 0.2;
		context.fillRect(390, 305, 660, 70);
		context.restore();

		context.save();
		RoundedBox(context, 390, 145, 660, 50, 20);
		context.strokeStyle = "#BFC85A22";
		context.stroke();
		context.clip();
		context.fillStyle = LevelBarBackground;
		context.globalAlpha = 0.2;
		context.fillRect(390, 145, 660, 50);
		context.restore();

		context.save();
		RoundedBox(context, 390, 145, progress, 50, 20);
		context.strokeStyle = "#BFC85A22";
		context.stroke();
		context.clip();
		context.fillStyle = LevelBarFill;
		context.globalAlpha = 0.5;
		context.fillRect(390, 145, progress, 50);
		context.restore();

		context.save();
		context.textAlign = "left";
		context.fillStyle = "#ffffff";
		context.globalAlpha = 0.8;
		context.font = "30px \"Sans Serif\"";
		context.fillText(`${locales.next_level}: ` + shortener(nextLevelXP) + ` ${locales.xp}`, 390, 230);
		context.restore();

		const textXPEdited = TextXpNeeded.replace(/{needed}/g, shortener(nextLevelXP)).replace(/{current}/g, shortener(dbUser.xp));
		context.textAlign = "center";
		context.fillStyle = "#474747";
		context.globalAlpha = 1;
		context.font = "30px \"Sans Serif\"";
		context.fillText(textXPEdited, 730, 180);

	} else {
		// TODO: Add support for modern mode\

		canvas = createCanvas(1080, 360);
	}

	return {
		attachment: canvas.toBuffer("image/png"),
		description: "Simply-XP Rank Card",
		name: "rank.png"
	};
}

/**
 * Generate a simple leaderboard card
 * @async
 * @param {Array<User>} data - Array of user data
 * @param {LeaderboardOptions?} options - (artworkColor, artworkImage, light)
 * @param {{name: string, imageURL: string, memberCount: number}?} guildInfo - Guild info
 * @param {LeaderboardLocales} locales - Locales
 * @link [Documentation](https://simplyxp.js.org/docs/leaderboard)
 * @returns {Promise<{attachment: Buffer, description: string, name: string}>}
 * @throws {XpFatal} - If parameters are not provided correctly
 */
export async function leaderboardCard(data: Array<User>, options: LeaderboardOptions = {}, guildInfo?: { name: string, imageURL: string, memberCount: number }, locales: LeaderboardLocales = {}): Promise<{ attachment: Buffer; description: string; name: string; }> {
	if (!data || data.length < 1) throw new XpFatal({function: "leaderboardCard()", message: "There must be at least 1 user in the data array"});

	if (!cachedLeaderboardArtwork && options?.artworkImage) cachedLeaderboardArtwork = await loadImage(options.artworkImage);
	if (!cachedLeaderboardImage && options?.backgroundImage) cachedLeaderboardImage = await loadImage(options.backgroundImage);

	GlobalFonts.registerFromPath(options?.font || join(__dirname, "Fonts", "Baloo-Regular.eot"), "Sans Serif");

	if (!locales.level) locales.level = "LEVEL";
	if (!locales.members) locales.members = "Members";

	data = data.slice(0, 8);

	let canvas: Canvas, context: SKRSContext2D, colors;

	// make a colour object containing colours for both dark and light mode
	if (options?.light) {
		colors = {
			artworkColors: options?.artworkColors || ["#374bff", "#5f69ff"],
			backgroundColor: "#f0f0eb",
			borderColors: options?.borderColors || ["#ffa237", "#ffcc6b"],
			evenColor: "#dcdcdc",
			oddColor: "#c8c8c8",
			primaryTextColor: "#000000",
			secondaryTextColor: "rgba(0,0,0,0.5)"
		};
	} else colors = {
		artworkColors: options?.artworkColors || ["#374bff", "#333793"],
		backgroundColor: "#141414",
		borderColors: options?.borderColors || ["#ffa237", "#b67125"],
		evenColor: "#1e1e1e",
		oddColor: "#282828",
		primaryTextColor: "#ffffff",
		secondaryTextColor: "rgba(255,255,255,0.5)"
	};

	if (!cachedLeaderboardCanvas || !cachedLeaderboardContext) {
		canvas = createCanvas(1350, 1080);
		context = canvas.getContext("2d");

		// make entire canvas rounded
		RoundedBox(context, 0, 0, canvas.width, canvas.height, 20);
		context.clip();

		// fill down from 0 to 220 pixels with either options.artworkColor or blurple gradient
		// left to right gradiant
		const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
		gradient.addColorStop(0, colors.artworkColors[0]);
		gradient.addColorStop(1, colors.artworkColors[1]);
		context.fillStyle = gradient;
		context.fillRect(0, 0, canvas.width, 220);

		if (cachedLeaderboardArtwork) {
			context.fillStyle = "#000000";
			context.fillRect(0, 0, canvas.width, 220);
			context.globalAlpha = 0.5;
			context.drawImage(cachedLeaderboardArtwork, 0, 0, canvas.width, 220);
			context.globalAlpha = 1;
		}

		// fill down from 220 to 1080 pixels with either options.backgroundColor or #141414
		context.fillStyle = options.backgroundColor || colors.backgroundColor;
		context.fillRect(0, 220, canvas.width, 1080);

		if (cachedLeaderboardImage) {
			context.globalAlpha = 0.9;
			context.drawImage(cachedLeaderboardImage, 0, 220, canvas.width, 1080);
			context.globalAlpha = 1;
		}

	} else {
		canvas = cachedLeaderboardCanvas;
		context = cachedLeaderboardContext;
	}

	if (guildInfo && guildInfo?.imageURL && guildInfo?.name && guildInfo?.memberCount) {
		const guildIcon = await loadImage(guildInfo.imageURL);
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
		context.lineWidth = 10;
		context.beginPath();
		context.arc(150, 110, 90, 0, Math.PI * 2, true);
		context.stroke();

		context.fillStyle = colors.primaryTextColor;
		context.font = "60px \"Sans Serif\"";
		context.fillText(guildInfo.name, 270, 110);

		context.fillStyle = colors.secondaryTextColor;
		context.font = "40px \"Sans Serif\"";
		context.fillText(`${guildInfo.memberCount} ${locales.members}`, 270, 160);
	}

	let currentCardColor = colors.evenColor;
	for (let i = 0; i < data.length; i++) {
		const cardY = 300 + (i * 90);

		if (data.length === 1) {
			RoundedBox(context, 30, cardY, 1290, 90, 20);
		} else {
			if (i === 0) {
				RoundedBox(context, 30, cardY, 1290, 90, 20, {top: true, bottom: false});

			} else if (i === data.length - 1) {
				RoundedBox(context, 30, cardY, 1290, 90, 20, {top: false, bottom: true});
			} else {
				RoundedBox(context, 30, cardY, 1290, 90, 0);
			}
		}

		context.fillStyle = currentCardColor;
		context.globalAlpha = cachedLeaderboardImage ? 0.5 : 1;
		context.fill();

		context.globalAlpha = 1;

		context.textAlign = "left";
		context.font = "30px \"Sans Serif\"";
		context.fillStyle = colors.secondaryTextColor;
		context.fillText(`${i + 1}.`, 60, cardY + 55);

		// add username after position's width + 20 pixels
		context.textAlign = "left";
		context.font = "40px \"Sans Serif\"";
		context.fillStyle = colors.primaryTextColor;
		context.fillText(data[i]?.name || data[i]?.user || "???", 120, cardY + 60);

		context.textAlign = "right";
		context.font = "30px \"Sans Serif\"";
		context.fillStyle = colors.primaryTextColor;
		context.fillText(shortener(data[i]?.level) || "???", 1270, cardY + 55);
		context.fillStyle = colors.secondaryTextColor;
		context.fillText(locales.level, 1270 - context.measureText(shortener(data[i]?.level) || "???").width - 15, cardY + 55);

		currentCardColor = currentCardColor === colors.evenColor ? colors.oddColor : colors.evenColor;
	}

	return {
		attachment: canvas.toBuffer("image/png"),
		description: "Simply-XP Leaderboard Card",
		name: "leaderboard.png"
	};
}

function RoundedBox(ctx: {
	beginPath: () => void;
	moveTo: (arg0: number, arg1: number) => void;
	lineTo: (arg0: number, arg1: number) => void;
	quadraticCurveTo: (arg0: number, arg1: number, arg2: number, arg3: number) => void;
	closePath: () => void;
}, x: number, y: number, width: number, height: number, radius: number, roundCorners: { top?: boolean, bottom?: boolean } = {top: true, bottom: true}) {
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
}

function shortener(count: number | undefined): string {
	const COUNT_ABBREVIATIONS = [
		"", // 0
		"k", // Thousands
		"M", // Millions
		"B", // Billions
		"T", // Trillions
		"Qa", // Quadrillions
		"Qi", // Quintillions
		"Sx", // Sextillions
		"Sp", // Septillions
	];

	if (!count || count === 0) return "0";
	if (count === Infinity) return "∞";

	const i = Math.floor(Math.log(count) / Math.log(1000));
	if (i >= COUNT_ABBREVIATIONS.length) {
		return count.toFixed(0) + COUNT_ABBREVIATIONS[COUNT_ABBREVIATIONS.length - 1];
	} else {
		return (count / Math.pow(1000, i)).toFixed(i === 0 ? 0 : 2) + COUNT_ABBREVIATIONS[i];
	}
}


function dynamicFont(context: SKRSContext2D, text: string, x: number, y: number, maxWidth: number, maxSize: number) {
	let fontSize = maxSize;

	while (fontSize > 0) {
		context.font = `${fontSize}px "Sans Serif"`;
		if (context.measureText(text).width < maxWidth) {
			break;
		}
		fontSize--;
	}

	context.textAlign = "center";
	context.fillText(text, x, y);
}