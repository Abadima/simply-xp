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

export type CompareCardLocales = {
	level?: string;
	versus?: string;
}

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
 * @property {string} font - ABSOLUTE FILE PATH
 * @property {boolean} light - Use light theme
 */
export interface LeaderboardCardOptions {
	artworkColors?: [HexColor, HexColor];
	artworkImage?: URL;
	borderColors?: [HexColor, HexColor];
	backgroundColor?: HexColor;
	backgroundImage?: URL;
	font?: string;
	light?: boolean;
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
 * @param {CompareCardOptions?} options - (background, color, legacy, lvlbar, lvlbarBg, font)
 * @param {CompareCardLocales?} locales - [BETA] Translate the rank card
 * @link `Documentation` https://simplyxp.js.org/docs/next/functions/compareCard
 * @returns {Promise<{attachment: Buffer, description: string, name: string}>}
 * @throws {XpFatal} - If parameters are not provided correctly or if the user is not found in the database
 */
export async function compareCard(guild: {
	id: string, name: string
}, user1: CardUserOptions, user2: CardUserOptions, options: CompareCardOptions = {}, locales: CompareCardLocales = {}): Promise<{
	attachment: Buffer;
	description: string;
	name: string;
}> {
	if (!guild?.id || !guild?.name) throw new XpFatal({function: "compareCard()", message: "Please provide a guild"});
	if (!user1?.id || !user1?.username || !user2?.id || !user2?.username) throw new XpFatal({
		function: "compareCard()",
		message: "Please provide two valid users!"
	});

	if (!user1?.avatarURL.endsWith(".png") && !user1.avatarURL.endsWith(".jpg") && !user1.avatarURL.endsWith(".webp")) {
		throw new XpFatal({
			function: "compareCard()", message: "[USER 1] Avatar image must be a png, jpg, or webp"
		});
	}

	if (!user2?.avatarURL.endsWith(".png") && !user2.avatarURL.endsWith(".jpg") && !user2.avatarURL.endsWith(".webp")) {
		throw new XpFatal({
			function: "compareCard()", message: "[USER 2] Avatar image, avatar image must be a png, jpg, or webp"
		});
	}

	GlobalFonts.registerFromPath(options?.font || join(__dirname, "Fonts", "BalooBhaijaan-Regular.woff2"), "Sans Serif");

	if (!locales?.level) locales.level = "Level";
	if (!locales?.versus) locales.versus = "vs";

	const compareImage = await loadImage(options?.background || "https://i.ibb.co/WnfXZjc/clouds.jpg").catch(() => {
		throw new XpFatal({
			function: "compareCard()", message: "Unable to load background image, is it valid?"
		});
	});

	const avatarURL1 = await loadImage(user1.avatarURL).catch(() => {
		throw new XpFatal({
			function: "compareCard()", message: "[USER 1] Unable to load user's AvatarURL, is it reachable?"
		});
	});

	const avatarURL2 = await loadImage(user2.avatarURL).catch(() => {
		throw new XpFatal({
			function: "compareCard()", message: "[USER 2] Unable to load user's AvatarURL, is it reachable?"
		});
	});

	let dbUser1 = await db.findOne({collection: "simply-xps", data: {guild: guild.id, user: user1.id}}) as User;
	if (!dbUser1) {
		if (xp.auto_create && user2?.username) dbUser1 = await create(user1.id, guild.id, user1.username) as User;
		else throw new XpFatal({function: "compareCard()", message: "[USER 1] User not found in database"});
	}

	let dbUser2 = await db.findOne({collection: "simply-xps", data: {guild: guild.id, user: user2.id}}) as User;
	if (!dbUser2) {
		if (xp.auto_create && user2?.username) dbUser2 = await create(user2.id, guild.id, user2.username) as User;
		else throw new XpFatal({function: "compareCard()", message: "[USER 2] User not found in database"});
	}

	const canvas = createCanvas(1080, 400);
	const context = canvas.getContext("2d");

	RoundedBox(context, 0, 0, canvas.width, canvas.height, 25);
	context.clip();

	context.globalAlpha = 0.2;

	context.fillStyle = options?.light ? "#ffffff" : "#000000";
	context.fill();

	context.globalAlpha = 0.5;

	context.drawImage(compareImage, -5, 0, 1090, 400);
	context.restore();

	context.globalAlpha = 1;

	const Username1 = user1.username.replace(/[\u007f-\uffff]/g, ""),
		Username2 = user2.username.replace(/[\u007f-\uffff]/g, ""),
		cardBoxColor = options?.color || "rgba(255,255,255,0.5)",
		CenterBarBackground = options?.centerBarBg || options?.light ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
		LvlText1 = locales.level + ` ${shortener(dbUser1.level)}`,
		LvlText2 = locales.level + ` ${shortener(dbUser2.level)}`;

	// Add Usernames
	context.save();
	context.textAlign = "center";
	context.fillStyle = "#ffffff";
	context.shadowColor = "#000000";
	context.shadowBlur = 6;
	context.shadowOffsetX = 1;
	context.shadowOffsetY = 1;
	context.font = "39px \"Sans Serif\"";
	context.fillText(`${Username1} ${locales.versus} ${Username2}`, 540, 60);
	context.restore();

	// Add User 1 Avatar
	context.save();
	context.beginPath();
	context.arc(160, 200, 100, 0, Math.PI * 2, true);
	context.closePath();
	context.strokeStyle = cardBoxColor;
	context.lineWidth = 15;
	context.stroke();
	context.clip();
	context.drawImage(avatarURL1, 50, 90, 220, 220);
	context.restore();

	// Add User 2 Avatar
	context.save();
	context.beginPath();
	context.arc(920, 200, 100, 0, Math.PI * 2, true);
	context.closePath();
	context.strokeStyle = cardBoxColor;
	context.lineWidth = 15;
	context.stroke();
	context.clip();
	context.drawImage(avatarURL2, 810, 90, 220, 220);
	context.restore();

	// Add Level Texts
	context.save();
	context.globalAlpha = 1;
	context.fillStyle = "#ffffff";
	context.textAlign = "center";
	context.font = "25px \"Sans Serif\"";
	context.fillText(LvlText1, 160, 350);

	context.fillText(LvlText2, 920, 350);
	context.restore();

	// Add sleek center bar
	context.save();
	context.globalAlpha = 1;
	RoundedBox(context, 265, 330, 540, 25, 10);
	context.clip();
	context.fillStyle = CenterBarBackground;
	context.fill();

	return {
		attachment: canvas.toBuffer("image/png"),
		description: "Simply-XP Comparison Card",
		name: "compareCard.png"
	};
}

/**
 * Generate a simple leaderboard card
 * @async
 * @param {Array<User>} data - Array of user data
 * @param {LeaderboardCardOptions?} options - (artworkColor, artworkImage, light)
 * @param {{name: string, imageURL: string, memberCount: number}?} guildInfo - Guild info
 * @param {LeaderboardCardLocales?} locales - Locales
 * @link `Documentation` https://simplyxp.js.org/docs/next/functions/leaderboard
 * @returns {Promise<{attachment: Buffer, description: string, name: string}>}
 * @throws {XpFatal} - If parameters are not provided correctly
 */
export async function leaderboardCard(data: Array<User>, options: LeaderboardCardOptions = {}, guildInfo?: {
	name: string,
	imageURL: string,
	memberCount: number
}, locales: LeaderboardCardLocales = {}): Promise<{ attachment: Buffer; description: string; name: string; }> {
	if (!data || data.length < 1) throw new XpFatal({
		function: "leaderboardCard()",
		message: "There must be at least 1 user in the data array"
	});

	if (!cachedLeaderboardArtwork && options?.artworkImage) cachedLeaderboardArtwork = await loadImage(options.artworkImage).catch(() => {
		throw new XpFatal({
			function: "leaderboardCard()", message: "Unable to load artwork image, is it valid?"
		});
	});

	if (!cachedLeaderboardImage && options?.backgroundImage) cachedLeaderboardImage = await loadImage(options.backgroundImage).catch(() => {
		throw new XpFatal({
			function: "leaderboardCard()", message: "Unable to load background image, is it valid?"
		});
	});

	GlobalFonts.registerFromPath(options?.font || join(__dirname, "Fonts", "BalooBhaijaan-Regular.woff2"), "Sans Serif");

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
				RoundedBox(context, 30, cardY, 1290, 90, 20, undefined, {top: true, bottom: false});

			} else if (i === data.length - 1) {
				RoundedBox(context, 30, cardY, 1290, 90, 20, undefined, {top: false, bottom: true});
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

/**
 * Generate a simple user rank card
 * @async
 * @param {{id: string, name: string}} guild - (id, name)
 * @param {CardUserOptions} user - (id, username, avatarURL)
 * @param {RankCardOptions?} options - (background, color, legacy, lvlbar, lvlbarBg, font)
 * @param {RankCardLocales?} locales - [BETA] Translate the rank card
 * @link `Documentation` https://simplyxp.js.org/docs/next/functions/rankCard
 * @returns {Promise<{attachment: Buffer, description: string, name: string}>}
 * @throws {XpFatal} - If parameters are not provided correctly
 */
export async function rankCard(guild: {
	id: string, name: string
}, user: CardUserOptions, options: RankCardOptions = {}, locales: RankCardLocales = {}): Promise<{
	attachment: Buffer; description: string; name: string;
}> {
	if (!guild) throw new XpFatal({function: "rankCard()", message: "No Guild Provided"});
	if (!user) throw new XpFatal({function: "rankCard()", message: "No User Provided"});

	let canvas: Canvas, context: SKRSContext2D;

	if (!locales?.level) locales.level = "Level";
	if (!locales?.next_level) locales.next_level = "Next Level";
	if (!locales?.xp) locales.xp = "XP";

	XpLog.debug("rankCard()", `${options?.legacy ? "LEGACY" : "MODERN"} ENABLED`);

	if (!user?.avatarURL.endsWith(".png") && !user.avatarURL.endsWith(".jpg") && !user.avatarURL.endsWith(".webp")) {
		throw new XpFatal({
			function: "rankCard()", message: "Invalid avatar image, avatar image must be a png, jpg, or webp"
		});
	}


	if (!user || !user.id || !user.username) {
		throw new XpFatal({
			function: "rankCard()", message: "Invalid User Provided, user must contain id, username, and avatarURL."
		});
	}

	GlobalFonts.registerFromPath(options?.font || join(__dirname, "Fonts", "BalooBhaijaan-Regular.woff2"), "Sans Serif");

	if (!cachedRankImage) cachedRankImage = await loadImage(options?.background || (options?.legacy ? "https://i.ibb.co/dck2Tnt/rank-card.webp" : "https://i.ibb.co/WnfXZjc/clouds.jpg")).catch(() => {
		throw new XpFatal({
			function: "rankCard()", message: "Unable to load background image, is it valid?"
		});
	});

	const avatarURL = await loadImage(user.avatarURL).catch(() => {
		throw new XpFatal({
			function: "rankCard()", message: "Unable to load user's AvatarURL, is it reachable?"
		});
	});

	let dbUser = await db.findOne({collection: "simply-xps", data: {guild: guild.id, user: user.id}}) as User;
	if (!dbUser) {
		if (xp.auto_create) dbUser = await create(user.id, guild.id, user.username) as User;
		else throw new XpFatal({function: "rankCard()", message: "User not found in database"});
	}

	const users = await db.find({collection: "simply-xps", data: {guild: guild.id}}) as User[];

	dbUser.position = users.sort((a, b) => b.xp - a.xp).findIndex((u) => u.user === user.id) + 1;

	if (!cachedRankContext || !cachedRankCanvas) {
		canvas = createCanvas(1080, 400);
		context = canvas.getContext("2d");

		RoundedBox(context, 0, 0, canvas.width, canvas.height, 25);
		context.clip();

		if (options?.legacy) {
			context.globalAlpha = 1;
			context.fillStyle = "#000000";
			context.fill();
		} else {
			context.globalAlpha = 0.2;
			context.fillStyle = options?.light ? "#ffffff" : "#000000";
			context.fill();

			context.globalAlpha = 0.5;
		}

		context.drawImage(cachedRankImage, -5, 0, 1090, 400);
		context.restore();
	} else {
		canvas = cachedRankCanvas;
		context = cachedRankContext;
	}

	const Username = user.username.replace(/[\u007f-\uffff]/g, ""),
		rankBoxColor = options?.color || (options?.legacy ? "#9900ff" : "rgba(255,255,255,0.5)"),
		LevelBarFill = options?.lvlbar || "#ffffff",
		LevelBarBackground = options?.lvlbarBg || options?.legacy ? "#FFFFFF" : (options?.light ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"),
		TextEXP = shortener(dbUser.xp) + ` ${locales.xp}`,
		LvlText = locales.level + ` ${shortener(dbUser.level)}`,
		TextXpNeeded = "{current} / {needed}",
		nextLevelXP = convertFrom(dbUser.level + 1),
		currentLevelXP = convertFrom(dbUser.level),
		progress = (((100 * (dbUser.xp - currentLevelXP)) / (nextLevelXP - currentLevelXP)) * (options?.legacy ? 660 : 530)) / 100,
		positionColour = dbUser.user === "326815959358898189" ? "#ade6d8" : dbUser.position === 1 ? "#ADD8E6" : dbUser.position === 2 ? "#C0C0C0" : dbUser.position === 3 ? "#CD7F32" : "#ffffff";


	context.save();
	if (!options?.legacy) {
		context.globalAlpha = 1;

		// Add Username
		context.save();
		context.textAlign = "center";
		context.fillStyle = "#ffffff";
		context.shadowColor = "#000000";
		context.shadowBlur = 5;
		context.shadowOffsetX = 1;
		context.shadowOffsetY = 1;
		context.font = "39px \"Sans Serif\"";
		context.fillText(Username, 540, 80);
		context.restore();

		// Add Avatar
		context.save();
		context.beginPath();
		context.arc(160, 200, 100, 0, Math.PI * 2, true);
		context.closePath();
		context.strokeStyle = rankBoxColor;
		context.lineWidth = 15;
		context.stroke();
		context.clip();
		context.drawImage(avatarURL, 50, 90, 220, 220);
		context.restore();

		// Add Position Badge
		context.save();
		context.beginPath();
		context.arc(230, 130, 30, 0, Math.PI * 2, true);
		context.closePath();
		context.strokeStyle = rankBoxColor;
		context.lineWidth = 5;
		context.stroke();
		context.clip();

		context.beginPath();
		context.arc(230, 130, 30, 0, Math.PI * 2, true);
		context.closePath();
		context.fillStyle = positionColour;
		context.fill();
		context.clip();

		// Add Position Text
		context.fillStyle = "#000000";
		context.textAlign = "center";
		context.font = "25px \"Sans Serif\"";
		context.fillText(shortener(dbUser.position, true), 230, 138);
		context.restore();

		// Add Level Text
		context.save();
		context.fillStyle = "#ffffff";
		context.font = "25px \"Sans Serif\"";
		context.textAlign = "center";
		context.globalAlpha = 1;
		context.fillText(LvlText, 160, 350);
		context.restore();

		// Add sleek progress bar
		context.save();
		context.globalAlpha = 1;
		RoundedBox(context, 265, 330, 540, 25, 10);
		context.clip();
		context.fillStyle = LevelBarBackground;
		context.fill();

		// now fill the progress bar
		RoundedBox(context, 270, 335, progress, 15, 5);
		context.fillStyle = LevelBarFill;
		context.fill();
		context.restore();

		// Right in the middle, add the XP Text
		context.save();
		context.textAlign = "center";
		context.fillStyle = "#ffffff";
		context.globalAlpha = 0.6;
		context.font = "20px \"Sans Serif\"";
		context.fillText(TextXpNeeded.replace(/{needed}/g, shortener(nextLevelXP)).replace(/{current}/g, shortener(dbUser.xp)), 540, 320);

		// Add Level Text (Next Level)
		context.save();
		context.fillStyle = "#ffffff";
		context.textAlign = "center";
		context.globalAlpha = 1;
		context.font = "25px \"Sans Serif\"";
		context.fillText(`${locales.level} ` + shortener(dbUser.level + 1), 920, 350);
		context.restore();

	} else {
		context.fillStyle = "#000000";
		context.globalAlpha = 0.4;
		context.fillRect(40, 0, 240, canvas.height);
		context.globalAlpha = 1;

		RoundedBox(context, 70, 30, 180, 180, 50);
		context.strokeStyle = rankBoxColor;
		context.lineWidth = 15;
		context.stroke();
		context.clip();
		context.drawImage(avatarURL, 70, 30, 180, 180);
		context.restore();

		context.save();
		RoundedBox(context, 70, 240 + 50 + 30, 180, 50, 20, "#BFC85A22");
		context.fillStyle = rankBoxColor;
		context.globalAlpha = 1;
		context.fillRect(70, 320, 180, 50);
		context.globalAlpha = 1;
		context.fillStyle = "#ffffff";
		context.textAlign = "center";
		dynamicFont(context, TextEXP, 160, 358, 160, 32);
		context.restore();

		context.save();
		RoundedBox(context, 70, 240, 180, 50, 20, "#BFC85A22");
		context.fillStyle = rankBoxColor;
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
		context.fillText("#" + dbUser.position, canvas.width - 55, 80);
		context.restore();

		context.save();
		RoundedBox(context, 390, 305, 660, 70, 20, "#BFC85A22");
		context.fillStyle = "#ffffff";
		context.textAlign = "center";
		dynamicFont(context, guild.name, 720, 355, 700, 45);
		context.globalAlpha = 0.2;
		context.fillRect(390, 305, 660, 70);
		context.restore();

		context.save();
		RoundedBox(context, 390, 145, 660, 50, 20, "#BFC85A22");
		context.fillStyle = LevelBarBackground;
		context.globalAlpha = 0.2;
		context.fillRect(390, 145, 660, 50);
		context.restore();

		context.save();
		RoundedBox(context, 390, 145, progress, 50, 20, "#BFC85A22");
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
	}

	return {
		attachment: canvas.toBuffer("image/png"),
		description: "Simply-XP Rank Card",
		name: "rank.png"
	};
}

/**
 * @constructor
 * @private
 */
export function RoundedBox(
	ctx: SKRSContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number,
	strokeColor?: string, roundCorners: {
		top?: boolean,
		bottom?: boolean
	} = {top: true, bottom: true}) {
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

	if (strokeColor) {
		ctx.strokeStyle = strokeColor;
		ctx.stroke();
		ctx.clip();
	}
}

function shortener(count: number | undefined, roundedNumber?: boolean): string {
	let abbreviation = "", i = 0;
	const base = 1000;

	if (!count || count === 0) return "0";
	if (count === Infinity) return "∞";

	while (count >= base && i < 8) {
		count /= base;
		i++;
	}

	switch (i) {
	case 1:
		abbreviation = "K"; // Thousands
		break;
	case 2:
		abbreviation = "M"; // Millions
		break;
	case 3:
		abbreviation = "B"; // Billions
		break;
	case 4:
		abbreviation = "T"; // Trillions
		break;
	case 5:
		abbreviation = "Qa"; // Quadrillions
		break;
	case 6:
		abbreviation = "Qi"; // Quintillions
		break;
	case 7:
		abbreviation = "Sx"; // Sextillions
		break;
	case 8:
		abbreviation = "Sp"; // Septillions
		break;
	default:
		break;
	}

	return `${count.toFixed(i === 0 ? 0 : (roundedNumber ? 0 : 2))}${abbreviation}`;
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