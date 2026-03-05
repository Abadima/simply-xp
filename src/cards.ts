import { clean, create, convertFrom, Database, registerFont, User, xp } from "../xp";
import { createCanvas, Image, loadImage, SKRSContext2D } from "@napi-rs/canvas";
import { XpFatal, XpLog } from "./functions/xplogs";
import { join } from "path";

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
 * @param {CompareCardOptions?} options - (background, color, legacy, lvlbar, lvlbarBg, font)
 * @param {CompareCardLocales?} locales - [BETA] Translate the rank card
 * @link `Documentation` https://simplyxp.js.org/docs/next/functions/compareCard
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
	if (!guild?.id || !guild?.name) throw new XpFatal({ function: "compareCard()", message: "Please provide a guild" });
	if (!user1?.id || !user1?.username || !user2?.id || !user2?.username) throw new XpFatal({
		function: "compareCard()",
		message: "Please provide two valid users!"
	});

	await registerFont(options?.font || join(__dirname, "fonts", "Baloo2-Regular.woff2"), "Baloo");
	if (options?.fallbackFont) await registerFont(options.fallbackFont, "FallbackFont");

	if (!locales?.level) locales.level = "Level";
	if (!locales?.versus) locales.versus = "vs";

	const compareImage = await loadImage(options?.background || "https://i.ibb.co/WnfXZjc/clouds.jpg").catch(() => {
		throw new XpFatal({
			function: "compareCard()", message: "Unable to load background image, is it valid and reachable?"
		});
	});

	const avatarURL1 = await loadImage(user1.avatarURL).catch(() => {
		throw new XpFatal({
			function: "compareCard()", message: "[USER 1] Unable to load user's AvatarURL, is it valid and reachable?"
		});
	});

	const avatarURL2 = await loadImage(user2.avatarURL).catch(() => {
		throw new XpFatal({
			function: "compareCard()", message: "[USER 2] Unable to load user's AvatarURL, is it valid and reachable?"
		});
	});

	let dbUser1 = await Database.findOne({ collection: "simply-xps", data: { guild: guild.id, user: user1.id } }) as User;
	if (!dbUser1) {
		if (xp.auto_create && user2?.username) dbUser1 = await create(user1.id, guild.id, user1.username) as User;
		else throw new XpFatal({ function: "compareCard()", message: "[USER 1] User not found in database" });
	}

	let dbUser2 = await Database.findOne({ collection: "simply-xps", data: { guild: guild.id, user: user2.id } }) as User;
	if (!dbUser2) {
		if (xp.auto_create && user2?.username) dbUser2 = await create(user2.id, guild.id, user2.username) as User;
		else throw new XpFatal({ function: "compareCard()", message: "[USER 2] User not found in database" });
	}

	const canvas = createCanvas(1080, 400);
	const context = canvas.getContext("2d");

	RoundedBox(context, 0, 0, canvas.width, canvas.height, 25);
	context.clip();

	context.fillStyle = (options?.light ? "#ffffff" : "#000000");
	context.fill();
	context.globalAlpha = 0.6;

	context.drawImage(compareImage, -5, 0, 1090, 400);
	context.restore();

	context.globalAlpha = 1;

	const cardBoxColor = options?.color || (options?.light ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)"),
		barFill = options?.centerBar || (options?.light ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.65)"),
		barBg = options?.centerBarBg || (options?.light ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)"),
		softStroke = "rgba(0,0,0,0.5)",
		textColor = "#ffffff",
		LvlText1 = locales.level + ` ${shortener(dbUser1.level, true)}`,
		LvlText2 = locales.level + ` ${shortener(dbUser2.level, true)}`;

	// User 1 name
	context.save();
	context.textAlign = "center";
	context.font = "32px Baloo, FallbackFont";
	context.lineJoin = "round";
	context.lineWidth = 5;
	context.strokeStyle = softStroke;
	context.strokeText(user1.username, 160, 50, 280);
	context.fillStyle = textColor;
	context.fillText(user1.username, 160, 50, 280);
	context.restore();

	// User 1 Avatar
	context.save();
	context.beginPath();
	context.arc(160, 195, 100, 0, Math.PI * 2);
	context.closePath();
	context.clip();
	context.fillStyle = cardBoxColor;
	context.fill();
	context.drawImage(avatarURL1, 50, 85, 220, 220);
	context.restore();

	context.save();
	context.beginPath();
	context.arc(160, 195, 105, 0, Math.PI * 2);
	context.closePath();
	context.strokeStyle = cardBoxColor;
	context.lineWidth = 5;
	context.stroke();
	context.restore();

	// User 1 Level
	context.save();
	context.textAlign = "center";
	context.font = "25px Baloo, FallbackFont";
	context.lineJoin = "round";
	context.lineWidth = 5;
	context.strokeStyle = softStroke;
	context.strokeText(LvlText1, 160, 342);
	context.fillStyle = textColor;
	context.fillText(LvlText1, 160, 342);
	context.restore();

	// User 1 XP
	context.save();
	context.textAlign = "center";
	context.font = "18px Baloo, FallbackFont";
	context.fillStyle = options?.light ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";
	context.fillText(`${shortener(dbUser1.xp)} XP`, 160, 366);
	context.restore();

	// User 2 name
	context.save();
	context.textAlign = "center";
	context.font = "32px Baloo, FallbackFont";
	context.lineJoin = "round";
	context.lineWidth = 5;
	context.strokeStyle = softStroke;
	context.strokeText(user2.username, 920, 50, 280);
	context.fillStyle = textColor;
	context.fillText(user2.username, 920, 50, 280);
	context.restore();

	// User 2 Avatar
	context.save();
	context.beginPath();
	context.arc(920, 195, 100, 0, Math.PI * 2);
	context.closePath();
	context.clip();
	context.fillStyle = cardBoxColor;
	context.fill();
	context.drawImage(avatarURL2, 810, 85, 220, 220);
	context.restore();

	context.save();
	context.beginPath();
	context.arc(920, 195, 105, 0, Math.PI * 2);
	context.closePath();
	context.strokeStyle = cardBoxColor;
	context.lineWidth = 5;
	context.stroke();
	context.restore();

	// User 2 Level
	context.save();
	context.textAlign = "center";
	context.font = "25px Baloo, FallbackFont";
	context.lineJoin = "round";
	context.lineWidth = 5;
	context.strokeStyle = softStroke;
	context.strokeText(LvlText2, 920, 342);
	context.fillStyle = textColor;
	context.fillText(LvlText2, 920, 342);
	context.restore();

	// User 2 XP
	context.save();
	context.textAlign = "center";
	context.font = "18px Baloo, FallbackFont";
	context.fillStyle = options?.light ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";
	context.fillText(`${shortener(dbUser2.xp)} XP`, 920, 366);
	context.restore();

	// VS badge
	context.save();
	context.textAlign = "center";
	context.font = "64px Baloo, FallbackFont";
	context.lineJoin = "round";
	context.lineWidth = 5;
	context.strokeStyle = softStroke;
	context.strokeText(locales.versus, 540, 208);
	context.fillStyle = "#ffffff";
	context.fillText(locales.versus, 540, 208);
	context.restore();

	// Tug-of-war XP bar with level diff inside
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

	context.save();
	context.textAlign = "center";
	context.font = "16px Baloo, FallbackFont";
	context.lineJoin = "round";
	context.lineWidth = 4;
	context.strokeStyle = softStroke;
	context.strokeText(diffText, 540, barY + 15);
	context.fillStyle = textColor;
	context.fillText(diffText, 540, barY + 15);
	context.restore();

	if (xp.auto_clean) clean();

	return {
		attachment: canvas.toBuffer("image/webp"),
		description: `${user1.username} (Lvl ${dbUser1.level}) vs ${user2.username} (Lvl ${dbUser2.level}) in ${guild.name}`.slice(0, 200),
		name: "compareCard.webp"
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
	name: string, imageURL: string, memberCount?: number
}, locales: LeaderboardCardLocales = {}): Promise<{ attachment: Buffer; description: string; name: string; }> {
	if (!data || data.length < 1) throw new XpFatal({
		function: "leaderboardCard()", message: "There must be at least 1 user in the data array"
	});

	let artworkImage: Image | undefined = undefined, backgroundImage: Image | undefined = undefined, colors;

	if (options?.artworkImage) artworkImage = await loadImage(options.artworkImage).catch(() => {
		throw new XpFatal({
			function: "leaderboardCard()", message: "Unable to load artwork image, is it valid?"
		});
	});

	if (options?.backgroundImage) backgroundImage = await loadImage(options.backgroundImage).catch(() => {
		throw new XpFatal({
			function: "leaderboardCard()", message: "Unable to load background image, is it valid?"
		});
	});

	await registerFont(options?.primaryFont || join(__dirname, "fonts", "Baloo2-Regular.woff2"), "Baloo");
	if (options?.secondaryFont) await registerFont(options.secondaryFont, "SecondaryFont");
	if (options?.fallbackFont) await registerFont(options.fallbackFont, "FallbackFont");

	if (!locales.level) locales.level = "LEVEL";
	if (!locales.members) locales.members = "Members";

	data = data.slice(0, 8);
	const font = options?.secondaryFont ? "SecondaryFont, FallbackFont" : "Baloo, FallbackFont";

	// make a colour object containing colours for both dark and light mode
	if (options?.light) {
		colors = {
			artworkColors: options?.artworkColors || ["#997fe1", "#616bff"],
			backgroundColor: "#FFFFFF",
			borderColors: options?.borderColors || ["#e0d440", "#fffa6b"],
			evenColor: options?.rowColors?.[0] || "#f0f0f0",
			oddColor: options?.rowColors?.[1] || "#dcdcdc",
			primaryTextColor: "#000000",
			secondaryTextColor: "rgba(0,0,0,0.5)"
		};
	} else colors = {
		artworkColors: options?.artworkColors || ["#6B46D4", "#2e3cff"],
		backgroundColor: "#141414",
		borderColors: options?.borderColors || ["#e0d440", "#fffa6b"],
		evenColor: options?.rowColors?.[0] || "#1e1e1e",
		oddColor: options?.rowColors?.[1] || "#282828",
		primaryTextColor: "#ffffff",
		secondaryTextColor: "rgba(255,255,255,0.5)"
	};

	const canvas = createCanvas(1350, 1080);
	const context = canvas.getContext("2d");

	// make entire canvas rounded
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

	context.fillStyle = options.backgroundColor || colors.backgroundColor;
	context.fillRect(0, 220, canvas.width, 1080);

	if (backgroundImage) {
		context.globalAlpha = 0.9;
		context.drawImage(backgroundImage, 0, 220, canvas.width, 1080);
		context.globalAlpha = 1;
	}

	if (guildInfo && guildInfo?.imageURL && guildInfo?.name) {
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
		context.lineWidth = 8;
		context.beginPath();
		context.arc(150, 110, 90, 0, Math.PI * 2, true);
		context.stroke();

		context.fillStyle = colors.primaryTextColor;
		context.font = "60px Baloo, FallbackFont";

		if (!guildInfo?.memberCount) {
			context.fillText(guildInfo.name, 270, 130);
		} else {
			context.fillText(guildInfo.name, 270, 110);

			context.fillStyle = colors.secondaryTextColor;
			context.font = "40px Baloo, FallbackFont";
			context.fillText(`${guildInfo.memberCount} ${locales.members}`, 270, 160);
		}
	}

	let currentCardColor = colors.evenColor;
	const rowOpacity = options?.rowOpacity && !isNaN(options?.rowOpacity) ? options.rowOpacity : (backgroundImage ? 0.5 : 1);
	for (let i = 0; i < data.length; i++) {
		const cardY = 300 + (i * 90);
		context.globalAlpha = rowOpacity;

		context.save();
		if (data.length === 1) {
			RoundedBox(context, 30, cardY, 1290, 90, 20, { clip: true, fill: { color: currentCardColor } });
		} else {
			if (i === 0) {
				RoundedBox(context, 30, cardY, 1290, 90, 20, {
					clip: true, fill: { color: currentCardColor }, roundCorners: { top: true, bottom: false }
				});
			} else if (i === data.length - 1) {
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

		// add username after position's width + 20 pixels
		context.textAlign = "left";
		context.font = `40px ${font}`;
		context.fillStyle = colors.primaryTextColor;
		context.fillText(data[i]?.name || data[i]?.user || "???", 120, cardY + 60);

		context.textAlign = "right";
		context.font = `30px ${font}`;
		context.fillStyle = colors.primaryTextColor;
		context.fillText(shortener(data[i]?.level) || "???", 1270, cardY + 55);
		context.fillStyle = colors.secondaryTextColor;
		context.fillText(locales.level, 1270 - context.measureText(shortener(data[i]?.level) || "???").width - 15, cardY + 55);

		currentCardColor = currentCardColor === colors.evenColor ? colors.oddColor : colors.evenColor;
	}

	if (xp.auto_clean) clean();

	return {
		attachment: canvas.toBuffer("image/webp"),
		description: (guildInfo?.name ? `${guildInfo.name} leaderboard` : "Leaderboard") + ` — Top ${data.length} user${data.length !== 1 ? "s" : ""}`.slice(0, 200),
		name: "leaderboard.webp"
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
	id: string,
	name: string
}, user: CardUserOptions, options: RankCardOptions = {}, locales: RankCardLocales = {}): Promise<{
	attachment: Buffer;
	description: string;
	name: string;
}> {
	if (!guild) throw new XpFatal({ function: "rankCard()", message: "No Guild Provided" });
	if (!user) throw new XpFatal({ function: "rankCard()", message: "No User Provided" });

	if (!locales?.level) locales.level = "Level";
	if (!locales?.next_level) locales.next_level = "Next Level";
	if (!locales?.xp) locales.xp = "XP";

	XpLog.debug("rankCard()", `${options?.legacy ? "LEGACY" : "MODERN"} ENABLED`);

	if (!user || !user.id || !user.username) {
		throw new XpFatal({
			function: "rankCard()", message: "Invalid User Provided, user must contain id, username, and avatarURL."
		});
	}

	await registerFont(options?.font || join(__dirname, "fonts", "Baloo2-Regular.woff2"), "Baloo");
	if (options?.fallbackFont) await registerFont(options.fallbackFont, "FallbackFont");

	const rankImage = await loadImage(options?.background || (options?.legacy ? "https://i.ibb.co/dck2Tnt/rank-card.webp" : "https://i.ibb.co/WnfXZjc/clouds.jpg")).catch(() => {
		throw new XpFatal({
			function: "rankCard()", message: "Unable to load background image, is it valid and reachable?"
		});
	});

	const avatarURL = await loadImage(user.avatarURL).catch(() => {
		throw new XpFatal({
			function: "rankCard()", message: "Unable to load user's AvatarURL, is it valid and reachable??"
		});
	});

	let dbUser = await Database.findOne({ collection: "simply-xps", data: { guild: guild.id, user: user.id } }) as User;
	if (!dbUser) {
		if (xp.auto_create) dbUser = await create(user.id, guild.id, user.username) as User;
		else throw new XpFatal({ function: "rankCard()", message: "User not found in database" });
	}

	const users = await Database.find("simply-xps", guild.id) as User[];

	dbUser.position = 1 + users.filter((u) => u.xp > dbUser.xp).length || 1;

	const canvas = createCanvas(1080, 400);
	const context = canvas.getContext("2d");

	context.save();
	RoundedBox(context, 0, 0, canvas.width, canvas.height, 25);
	context.clip();

	context.fillStyle = (options?.light ? "#ffffff" : "#000000");
	context.fill();
	context.globalAlpha = (options?.legacy ? 0.8 : 0.6);

	context.drawImage(rankImage, -5, 0, 1090, 400);
	context.restore();


	const rankBoxColor = options?.color || (options?.legacy ? "#9900ff" : (options?.light ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)")),
		LevelBarFill = options?.lvlbar || "#ffffff",
		LevelBarBackground = options?.lvlbarBg || options?.legacy ? "#FFFFFF" : (options?.light ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)"),
		TextEXP = shortener(dbUser.xp) + ` ${locales.xp}`,
		LvlText = locales.level + ` ${shortener(dbUser.level)}`,
		TextXpNeeded = "{current} / {needed}",
		nextLevelXP = convertFrom(dbUser.level + 1),
		currentLevelXP = convertFrom(dbUser.level),
		progress = (((100 * (dbUser.xp - currentLevelXP)) / (nextLevelXP - currentLevelXP)) * (options?.legacy ? 660 : 530)) / 100,
		positionColour = dbUser.user === "326815959358898189" ? "#ade6d8" : dbUser.position === 1 ? "#ADD8E6" : dbUser.position === 2 ? "#C0C0C0" : dbUser.position === 3 ? "#CD7F32" : "#ffffff";


	if (!options?.legacy) {

		// Username
		context.save();
		context.textAlign = "center";
		context.font = "40px Baloo, FallbackFont";
		context.lineJoin = "round";
		context.lineWidth = 7;
		context.strokeStyle = "rgba(0,0,0,0.35)";
		context.strokeText(user.username, 540, 80);
		context.fillStyle = "#ffffff";
		context.fillText(user.username, 540, 80);
		context.restore();

		// Avatar

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

		// Position Badge
		context.save();
		context.beginPath();
		context.arc(230, 130, 28, 0, Math.PI * 2);
		context.closePath();
		context.clip();
		context.fillStyle = positionColour;
		context.fill();

		// Position Text
		context.fillStyle = "#000000";
		dynamicFont(context, shortener(dbUser.position, true), 230, 138, 45, 30);
		context.restore();

		context.save();
		context.beginPath();
		context.arc(230, 130, 30, 0, Math.PI * 2);
		context.closePath();
		context.strokeStyle = rankBoxColor;
		context.lineWidth = 5;
		context.stroke();
		context.restore();

		// Level Text
		context.save();
		context.textAlign = "center";
		context.font = "25px Baloo, FallbackFont";
		context.lineJoin = "round";
		context.lineWidth = 5;
		context.strokeStyle = "rgba(0,0,0,0.35)";
		context.strokeText(LvlText, 160, 350);
		context.fillStyle = "#ffffff";
		context.fillText(LvlText, 160, 350);
		context.restore();

		// Progress Bar
		context.save();
		RoundedBox(context, 265, 330, 540, 25, 10, {
			clip: true, fill: { color: LevelBarBackground }
		});
		RoundedBox(context, 270, 335, progress, 15, 5, {
			clip: true, fill: { color: LevelBarFill }
		});
		context.restore();

		// XP Text
		context.save();
		context.textAlign = "center";
		context.font = "22px Baloo, FallbackFont";
		context.fillStyle = options?.light
			? "rgba(0,0,0,0.6)"
			: "rgba(255,255,255,0.6)";
		context.fillText(
			TextXpNeeded
				.replace(/{needed}/g, shortener(nextLevelXP))
				.replace(/{current}/g, shortener(dbUser.xp)),
			540,
			320
		);
		context.restore();

		// Next Level
		context.save();
		context.textAlign = "center";
		context.font = "25px Baloo, FallbackFont";
		const nextLvlText = `${locales.level} ` + shortener(dbUser.level + 1);
		context.lineJoin = "round";
		context.lineWidth = 5;
		context.strokeStyle = "rgba(0,0,0,0.35)";
		context.strokeText(nextLvlText, 920, 350);
		context.fillStyle = "#ffffff";
		context.fillText(nextLvlText, 920, 350);
		context.restore();

	} else {

		// Vertical Bar
		context.save();
		context.globalAlpha = 0.4;
		context.fillStyle = options?.light ? "#ffffff" : "#000000";
		context.fillRect(40, 0, 240, canvas.height);
		context.restore();

		// User Avatar
		context.save();
		RoundedBox(context, 70, 30, 180, 180, 50, { clip: true, fill: { color: rankBoxColor } });
		RoundedBox(context, 75, 35, 170, 170, 50, { clip: true });
		context.drawImage(avatarURL, 70, 30, 180, 180);
		context.restore();

		// EXP Text
		context.save();
		RoundedBox(context, 70, 320, 180, 50, 20, { clip: true });
		context.fillStyle = rankBoxColor;
		context.fillRect(70, 320, 180, 50);
		context.fillStyle = "#ffffff";
		dynamicFont(context, TextEXP, 160, 355, 160, 32);
		context.restore();

		// Level Text
		context.save();
		RoundedBox(context, 70, 240, 180, 50, 20, { clip: true });
		context.fillStyle = rankBoxColor;
		context.fillRect(70, 240, 180, 50);
		context.fillStyle = "#ffffff";
		context.textAlign = "center";
		dynamicFont(context, LvlText, 160, 275, 160, 32);
		context.restore();

		// Username
		context.save();
		context.textAlign = "left";
		context.font = "39px Baloo, FallbackFont";
		context.fillStyle = "#ffffff";
		context.lineJoin = "round";
		context.lineWidth = 5;
		context.strokeStyle = "rgba(0,0,0,0.35)";
		context.strokeText(user.username, 395, 80);
		context.fillText(user.username, 395, 80);
		context.restore();

		// Position Number
		context.save();
		context.textAlign = "right";
		context.font = "55px Baloo, FallbackFont";
		context.fillStyle = "#ffffff";
		context.lineJoin = "round";
		context.lineWidth = 7;
		context.strokeStyle = "rgba(0,0,0,0.35)";
		context.strokeText("#" + dbUser.position, canvas.width - 55, 80);
		context.fillText("#" + dbUser.position, canvas.width - 55, 80);
		context.restore();

		// Guild Name Background + Text
		context.save();
		RoundedBox(context, 390, 305, 660, 70, 20, { clip: true });
		context.globalAlpha = 0.2;
		context.fillStyle = "#ffffff";
		context.fillRect(390, 305, 660, 70);
		context.globalAlpha = 1;
		dynamicFont(context, guild.name, 720, 355, 700, 45);
		context.restore();

		// Level Bar Background
		context.save();
		RoundedBox(context, 390, 145, 660, 50, 20, { clip: true });
		context.globalAlpha = 0.2;
		context.fillStyle = LevelBarBackground;
		context.fillRect(390, 145, 660, 50);
		context.restore();

		// Level Bar Fill
		context.save();
		RoundedBox(context, 390, 145, progress, 50, 20, { clip: true });
		context.globalAlpha = 0.5;
		context.fillStyle = LevelBarFill;
		context.fillRect(390, 145, progress, 50);
		context.restore();

		// Next Level XP Text
		context.save();
		context.textAlign = "left";
		context.font = "30px Baloo, FallbackFont";
		context.fillStyle = "#ffffff";
		context.globalAlpha = 0.8;
		context.fillText(`${locales.next_level}: ${shortener(nextLevelXP)} ${locales.xp}`, 390, 230);
		context.restore();

		// XP Needed Text
		context.textAlign = "center";
		context.font = "30px Baloo, FallbackFont";
		context.fillStyle = "#474747";
		context.globalAlpha = 1;
		const textXPEdited = TextXpNeeded.replace(/{needed}/g, shortener(nextLevelXP)).replace(/{current}/g, shortener(dbUser.xp));
		context.fillText(textXPEdited, 730, 180);
	}

	if (xp.auto_clean) clean();

	return {
		attachment: canvas.toBuffer("image/webp"),
		description: `${user.username}'s rank card — Lvl ${dbUser.level} | ${shortener(dbUser.xp)} XP | #${dbUser.position} in ${guild.name}`.slice(0, 200),
		name: "rank.webp"
	};
}

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
		if (options?.clip) ctx.clip();
		if (options.fill?.color) ctx.fillStyle = options.fill.color;
		if (options.fill?.alpha) ctx.globalAlpha = options.fill.alpha;
		ctx.fillRect(x, y, width, height);
	}

	if (options?.stroke) {
		if (options.stroke?.color) ctx.strokeStyle = options.stroke.color;
		if (options.stroke?.width) ctx.lineWidth = options.stroke.width;
		ctx.stroke();
	}

	if (options?.clip) ctx.clip();
}

function shortener(count: number | undefined, roundedNumber?: boolean): string {
	let abbreviation = "", i = 0;
	const base = 1000;

	if (!count || count === 0) return "0";
	if (count > Number.MAX_SAFE_INTEGER) return "∞";

	while (count >= base && i < 8) {
		count /= base;
		i++;
	}

	switch (i) {
		case 0:
			abbreviation = ""; // Hundreds
			break;
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
		default:
			abbreviation = "S+"; // Quadrillions and more
			break;
	}

	return `${count.toFixed(i === 0 ? 0 : (roundedNumber ? 0 : 2))}${abbreviation}`;
}


function dynamicFont(context: SKRSContext2D, text: string, x: number, y: number, maxWidth: number, maxSize: number) {
	let fontSize = maxSize;

	while (fontSize > 0) {
		context.font = `${fontSize}px Baloo, FallbackFont`;
		if (context.measureText(text).width < maxWidth) {
			break;
		}
		fontSize--;
	}

	context.textAlign = "center";
	context.fillText(text, x, y);
}