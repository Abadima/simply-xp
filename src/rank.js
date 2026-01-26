const levels = require("../src/models/level.js");
const { join } = require("path");
const getUserPosition = require("./utils/getUserPosition");
const shortener = require("./utils/shortener");

/**
 * @param {Discord.Message} message
 * @param {string} userID
 * @param {string} guildID
 * @param {import("../index").rankOptions} options
 */

async function rank(message, userID, guildID, options = []) {
	if (!userID) throw new Error("[XP] User ID was not provided.");

	if (!guildID) throw new Error("[XP] Guild ID was not provided.");

	const user = await levels.findOne({
		user: userID,
		guild: guildID
	});
	if (!user) throw new Error("[XP] NO_DATA | User has no XP data.");

	user.position = (await getUserPosition(userID, guildID)) || 1;

	let targetxp = user.level + 1;

	let target = targetxp * targetxp * 100;

	return rankCard(message, {
		level: user.level,
		currentXP: user.xp,
		neededXP: target,
		rank: user.position,
		background: options.background,
		color: options.color,
		lvlbar: options.lvlbar,
		lvlbarBg: options.lvlbarBg,
		member: message.guild.members.cache.get(userID)?.user
	});

	async function rankCard(message, options = []) {
		try {
			const Canvas = require("@napi-rs/canvas");
			Canvas.GlobalFonts.registerFromPath(
				join(__dirname, "Fonts", "Baloo2-Regular.woff2"),
				"Sans Serif"
			);

			const member = options.member;

			const canvas = Canvas.createCanvas(1080, 400),
				ctx = canvas.getContext("2d");

			const name = member.tag;
			const noSymbols = (string) => string.replace(/[\u007f-\uffff]/g, "");

			let fsiz = "45px";
			if (message.guild.name.length >= 23) {
				fsiz = "38px";
			}
			if (message.guild.name.length >= 40) {
				fsiz = "28px";
			}
			if (message.guild.name.length >= 63) {
				fsiz = "22px";
			}

			let BackgroundRadius = "20",
				BackGroundImg =
					options.background ||
					"https://i.ibb.co/QQvMqf7/gradient.jpg",
				AttachmentName = "rank.png",
				AttachmentDesc = "Rank Card",
				Username = noSymbols(name),
				AvatarRoundRadius = "50",
				DrawLayerColor = "#000000",
				DrawLayerOpacity = 0.4,
				BoxColor = options.color || "#096DD1",
				LevelBarFill = options.lvlbar || "#ffffff",
				LevelBarBackground = options.lvlbarBg || "#ffffff",
				Rank = options.rank,
				TextEXP = shortener(options.currentXP) + " XP",
				LvlText = `Level ${shortener(options.level)}`,
				BarRadius = "20",
				TextXpNeded = "{current}/{needed}",
				CurrentXP = options.currentXP,
				NeededXP = options.neededXP;

			const drawStatBadge = (x, y, text, textY) => {
				ctx.save();
				RoundedBox(ctx, x, y, 180, 50, 20);
				ctx.strokeStyle = "#BFC85A22";
				ctx.stroke();
				ctx.clip();
				ctx.fillStyle = BoxColor;
				ctx.globalAlpha = 1;
				ctx.fillRect(x, y, 180, 50);
				ctx.globalAlpha = 1;
				ctx.fillStyle = "#ffffff";
				ctx.font = "32px \"Sans Serif\"";
				ctx.textAlign = "center";
				ctx.fillText(text, x + 90, textY);
				ctx.restore();
			};

			ctx.beginPath();
			ctx.moveTo(Number(BackgroundRadius), 0);
			ctx.lineTo(1080 - Number(BackgroundRadius), 0);
			ctx.quadraticCurveTo(1080, 0, 1080, Number(BackgroundRadius));
			ctx.lineTo(1080, 400 - Number(BackgroundRadius));
			ctx.quadraticCurveTo(
				1080,
				400,
				1080 - Number(BackgroundRadius),
				400
			);

			ctx.lineTo(Number(BackgroundRadius), 400);
			ctx.quadraticCurveTo(0, 400, 0, 400 - Number(BackgroundRadius));
			ctx.lineTo(0, Number(BackgroundRadius));
			ctx.quadraticCurveTo(0, 0, Number(BackgroundRadius), 0);
			ctx.closePath();
			ctx.clip();
			ctx.fillStyle = "#000000";
			ctx.fillRect(0, 0, 1080, 400);
			let background = await Canvas.loadImage(BackGroundImg);
			ctx.globalAlpha = 0.7;
			const canvasWidth = canvas.width;
			const canvasHeight = canvas.height;
			const scale = canvasWidth / background.width;
			const scaledHeight = background.height * scale;
			const yOffset = (canvasHeight - scaledHeight) / 2;
			ctx.drawImage(background, 0, yOffset, canvasWidth, scaledHeight);
			ctx.restore();

			ctx.fillStyle = DrawLayerColor;
			ctx.globalAlpha = DrawLayerOpacity;
			ctx.fillRect(40, 0, 240, canvas.height);
			ctx.globalAlpha = 1;

			let avatar = await Canvas.loadImage(member.displayAvatarURL());
			ctx.save();
			RoundedBox(ctx, 70, 30, 180, 180, Number(AvatarRoundRadius));
			ctx.strokeStyle = BoxColor;
			ctx.lineWidth = 15;
			ctx.stroke();
			ctx.clip();
			ctx.drawImage(avatar, 70, 30, 180, 180);
			ctx.restore();

			drawStatBadge(70, 320, TextEXP, 358);
			drawStatBadge(70, 240, LvlText, 278);

			ctx.save();
			ctx.textAlign = "left";
			ctx.fillStyle = "#ffffff";
			ctx.shadowColor = "#000000";
			ctx.shadowBlur = 15;
			ctx.shadowOffsetX = 1;
			ctx.shadowOffsetY = 1;
			ctx.font = "39px \"Sans Serif\"";
			ctx.fillText(Username, 390, 80);
			ctx.restore();

			ctx.save();
			ctx.textAlign = "right";
			ctx.fillStyle = "#ffffff";
			ctx.shadowColor = "#000000";
			ctx.shadowBlur = 15;
			ctx.shadowOffsetX = 1;
			ctx.shadowOffsetY = 1;
			ctx.font = "55px \"Sans Serif\"";
			ctx.fillText("#" + Rank, canvas.width - 55, 80);
			ctx.restore();

			ctx.save();
			RoundedBox(ctx, 390, 305, 660, 70, Number(20));
			ctx.strokeStyle = "#BFC85A22";
			ctx.stroke();
			ctx.clip();
			ctx.fillStyle = "#ffffff";
			ctx.font = `${fsiz} "Sans Serif"`;
			ctx.textAlign = "center";
			ctx.fillText(message.guild.name, 720, 355);
			ctx.globalAlpha = 0.2;
			ctx.fillRect(390, 305, 660, 70);
			ctx.restore();

			ctx.save();
			RoundedBox(ctx, 390, 145, 660, 50, Number(BarRadius));
			ctx.strokeStyle = "#BFC85A22";
			ctx.stroke();
			ctx.clip();
			ctx.fillStyle = LevelBarBackground;
			ctx.globalAlpha = 0.2;
			ctx.fillRect(390, 145, 660, 50, 50);
			ctx.restore();

			const percent = (100 * CurrentXP) / NeededXP;
			const progress = (percent * 660) / 100;

			ctx.save();
			RoundedBox(ctx, 390, 145, progress, 50, Number(BarRadius));
			ctx.strokeStyle = "#BFC85A22";
			ctx.stroke();
			ctx.clip();
			ctx.fillStyle = LevelBarFill;
			ctx.globalAlpha = 0.5;
			ctx.fillRect(390, 145, progress, 50, 50);
			ctx.restore();

			ctx.save();
			ctx.textAlign = "left";
			ctx.fillStyle = "#ffffff";
			ctx.globalAlpha = 0.8;
			ctx.font = "30px \"Sans Serif\"";
			ctx.fillText("Next Level: " + shortener(NeededXP) + " XP", 390, 230);
			ctx.restore();

			const latestXP = Number(CurrentXP) - Number(NeededXP);
			const textXPEdited = TextXpNeded.replace(/{needed}/g, shortener(NeededXP).toString())
				.replace(/{current}/g, shortener(CurrentXP).toString())
				.replace(/{latest}/g, latestXP.toString());
			ctx.textAlign = "center";
			ctx.fillStyle = "#474747";
			ctx.globalAlpha = 1;
			ctx.font = "30px \"Sans Serif\"";
			ctx.fillText(textXPEdited, 730, 180);

			return {
				attachment: canvas.toBuffer("image/webp"),
				description: AttachmentDesc,
				name: AttachmentName
			};
		} catch (err) {
			console.log(`[XP] Error Occured. | rankCard | Error: ${err.stack}`);
		}
	}
}

function RoundedBox(ctx, x, y, width, height, radius) {
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	ctx.lineTo(x + width, y + height - radius);
	ctx.quadraticCurveTo(
		x + width,
		y + height,
		x + width - radius,
		y + height
	);
	ctx.lineTo(x + radius, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	ctx.lineTo(x, y + radius);
	ctx.quadraticCurveTo(x, y, x + radius, y);
	ctx.closePath();
}

module.exports = rank;

