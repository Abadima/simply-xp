let Discord = require('discord.js')
const mongoose = require("mongoose");
const levels = require("./models/level.js");
const { join } = require("path");

let key;



async function connect(db, options = []) {
  if (!db) throw new Error("[XP] Database URL was not provided");

  key = db;
  mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  if (options.notify === false) return; else
    return console.log('{ XP } Database Connected');
}

async function create(userID, guildID) {
  if (!userID) throw new Error("[XP] User ID was not provided.")

  if (!guildID) throw new Error("[XP] User ID was not provided.")

  let uzer = await levels.findOne({ user: userID, guild: guildID })

  if (uzer) return false;

  const newuser = new levels({
    user: userID,
    guild: guildID
  });
}

async function addXP(userID, guildID, xp) {

  if (!userID) throw new Error("[XP] User ID was not provided.")

  if (!guildID) throw new Error("[XP] Guild ID was not provided.")

  if (!xp) throw new Error('[XP] XP amount is not provided.')

  let min;
  let max;
  if (xp.min) {

    if (!xp.max) throw new Error('[XP] XP min amount is provided but max amount is not provided.')

    min = Number(xp.min)

    if (Number(xp.min).toString() === 'NaN') throw new Error('[XP] XP amount (min) is not a number.')
  }

  if (xp.max) {


    if (!xp.min) throw new Error('[XP] XP max amount is provided but min amount is not provided.')

    max = Number(xp.max)

    if (Number(xp.max).toString() === 'NaN') throw new Error('[XP] XP amount (max) is not a number.')
  }

  if (xp.min && xp.max) {
    let randomNumber = Math.floor(Math.random() * (max - min) + min)

    xp = randomNumber
  }

  const user = await levels.findOne({ user: userID, guild: guildID });

  let lvl = Math.floor(0.1 * Math.sqrt(xp))

  if (!user) {
    const newUser = new levels({
      user: userID,
      guild: guildID,
      xp: xp,
      level: lvl
    });

    await newUser.save().catch(e => console.log(`[XP] Failed to save new use to database`))

    return {
      level: 0,
      exp: 0
    };

  }
  user.xp += parseInt(xp, 10);
  user.level = Math.floor(0.1 * Math.sqrt(user.xp));


  await user.save().catch(e => console.log(`[XP] Failed to add XP | User: ${userID} | Err: ${e}`));

  let level =
    Math.floor(0.1 * Math.sqrt(user.xp))


  xp = user.xp

  if (user.xp === 0 || Math.sign(user.xp) === -1) {
    xp = 0
  }


  return {
    level,
    xp
  }

}

async function setXP(userID, guildID, xp) {

  if (!userID) throw new Error("[XP] User ID was not provided.")

  if (!guildID) throw new Error("[XP] Guild ID was not provided.")

  if (!xp) throw new Error('[XP] XP amount is not provided.')

  if (Number(xp).toString() === 'NaN') throw new Error('[XP] XP amount is not a number.')

  const user = await levels.findOne({ user: userID, guild: guildID });

  let lvl = Math.floor(0.1 * Math.sqrt(xp))

  if (!user) {
    const newUser = new levels({
      user: userID,
      guild: guildID,
      xp: xp,
      level: lvl
    });

    await newUser.save().catch(e => console.log(`[XP] Failed to save new use to database`))

    return {
      xp: 0
    };

  }
  user.xp = xp
  user.level = Math.floor(0.1 * Math.sqrt(user.xp));

  await user.save().catch(e => console.log(`[XP] Failed to set XP | User: ${userID} | Err: ${e}`));

  return { xp }
}

async function fetch(userID, guildID) {
  if (!userID) throw new Error("[XP] User ID was not provided.")

  if (!guildID) throw new Error("[XP] Guild ID was not provided.")

  let user = await levels.findOne({
    user: userID,
    guild: guildID
  });
  if (!user) {
    const newuser = new levels({
      user: userID,
      guild: guildID
    });
  }

  user = await levels.findOne({
    user: userID,
    guild: guildID
  });

  const leaderboard = await levels.find({
    guild: guildID
  }).sort([['xp', 'descending']]).exec();

  user.position = leaderboard.findIndex(i => i.user === userID) + 1;

  let targetxp = user.level + 1

  let target = targetxp * targetxp * 100;

  function shortener(count) {
    const COUNT_ABBRS = ["", "k", "M", "T"];

    const i =
      0 === count ? count : Math.floor(Math.log(count) / Math.log(1000));
    let result = parseFloat((count / Math.pow(1000, i)).toFixed(2));
    result += `${COUNT_ABBRS[i]}`;
    return result;
  }

  let shortXP = shortener(user.xp)

  let shortReqXP = shortener(target)

  return {
    level: user.level,
    xp: user.xp,
    reqxp: target,
    rank: user.position,
    shortxp: shortXP,
    shortreq: shortReqXP
  }
}

async function rank(message, userID, guildID, options = []) {

  if (!userID) throw new Error("[XP] User ID was not provided.")

  if (!guildID) throw new Error("[XP] Guild ID was not provided.")

  const user = await levels.findOne({
    user: userID,
    guild: guildID
  });
  if (!user) return false;

  const leaderboard = await levels.find({
    guild: guildID
  }).sort([['xp', 'descending']]).exec();

  user.position = leaderboard.findIndex(i => i.user === userID) + 1;

  let targetxp = user.level + 1

  let target = targetxp * targetxp * 100;


  rankCard(message, {
    slash: options.slash,
    level: user.level,
    currentXP: user.xp,
    neededXP: target,
    rank: user.position,
    background: options.background,
    color: options.color,
    member: message.guild.members.cache.get(userID) ?.user
  })

  async function rankCard(message, options = []) {
    try {
      const Canvas = require("canvas");
      const { registerFont } = require("canvas");
      registerFont(join(__dirname, "Fonts", "Poppins-SemiBold.ttf"), {
        family: "Poppins-Regular"
      });
      registerFont(join(__dirname, "Fonts", "Poppins-SemiBold.ttf"), {
        family: "Poppins-Bold"
      });

      function shortener(count) {
        const COUNT_ABBRS = ["", "k", "M", "T"];

        const i =
          0 === count ? count : Math.floor(Math.log(count) / Math.log(1000));
        let result = parseFloat((count / Math.pow(1000, i)).toFixed(2));
        result += `${COUNT_ABBRS[i]}`;
        return result;
      }

      const member =
        options.member

      const canvas = Canvas.createCanvas(1080, 400),
        ctx = canvas.getContext("2d");

      const name = member.tag;
      const noSymbols = string => string.replace(/[\u007f-\uffff]/g, "");

      let BackgroundRadius = "20",
        BackGroundImg =
          options.background ||
          "https://media.discordapp.net/attachments/868506665102762034/876750913866461185/photo-1579546929518-9e396f3cc809.png?width=640&height=427",
        AttachmentName = "rank.png",
        Username = noSymbols(name),
        AvatarRoundRadius = "50",
        DrawLayerColor = "#000000",
        DrawLayerOpacity = "0.4",
        BoxColor = options.color || "#096DD1",
        LevelBarFill = "#ffffff",
        LevelBarBackground = "#ffffff",
        Rank = options.rank,
        TextEXP = shortener(options.currentXP) + " xp",
        LvlText = `Level ${shortener(options.level)}`,
        BarRadius = "20",
        TextXpNeded = "{current}/{needed}",
        CurrentXP = options.currentXP,
        NeededXP = options.neededXP;

      ctx.beginPath();
      ctx.moveTo(0 + Number(BackgroundRadius), 0);
      ctx.lineTo(0 + 1080 - Number(BackgroundRadius), 0);
      ctx.quadraticCurveTo(0 + 1080, 0, 0 + 1080, 0 + Number(BackgroundRadius));
      ctx.lineTo(0 + 1080, 0 + 400 - Number(BackgroundRadius));
      ctx.quadraticCurveTo(
        0 + 1080,
        0 + 400,
        0 + 1080 - Number(BackgroundRadius),
        0 + 400
      );

      ctx.lineTo(0 + Number(BackgroundRadius), 0 + 400);
      ctx.quadraticCurveTo(0, 0 + 400, 0, 0 + 400 - Number(BackgroundRadius));
      ctx.lineTo(0, 0 + Number(BackgroundRadius));
      ctx.quadraticCurveTo(0, 0, 0 + Number(BackgroundRadius), 0);
      ctx.closePath();
      ctx.clip();
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, 1080, 400);
      let background = await Canvas.loadImage(BackGroundImg);
      ctx.globalAlpha = 0.7;
      ctx.drawImage(background, 0, 0, 1080, 400);
      ctx.restore();

      ctx.fillStyle = DrawLayerColor;
      ctx.globalAlpha = DrawLayerOpacity;
      ctx.fillRect(40, 0, 240, canvas.height);
      ctx.globalAlpha = 1;

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

      let avatar = await Canvas.loadImage(
        member.displayAvatarURL({ dynamic: true, format: "png" })
      );
      ctx.save();
      RoundedBox(ctx, 40 + 30, 30, 180, 180, Number(AvatarRoundRadius));
      ctx.strokeStyle = BoxColor;
      ctx.lineWidth = "10";
      ctx.stroke();
      ctx.clip();
      ctx.drawImage(avatar, 40 + 30, 30, 180, 180);
      ctx.restore();

      ctx.save();
      RoundedBox(ctx, 40 + 30, 30 + 180 + 30 + 50 + 30, 180, 50, 20);
      ctx.strokeStyle = "#BFC85A22";
      ctx.stroke();
      ctx.clip();
      ctx.fillStyle = BoxColor;
      ctx.globalAlpha = "1";
      ctx.fillRect(40 + 30, 30 + 180 + 30 + 50 + 30, 180, 50);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#ffffff";
      ctx.font = '32px "Poppins-Bold"';
      ctx.textAlign = "center";
      ctx.fillText(TextEXP, 40 + 30 + 180 / 2, 30 + 180 + 30 + 30 + 50 + 38);
      ctx.restore();

      ctx.save();
      RoundedBox(ctx, 40 + 30, 30 + 180 + 30, 180, 50, 20);
      ctx.strokeStyle = "#BFC85A22";
      ctx.stroke();
      ctx.clip();
      ctx.fillStyle = BoxColor;
      ctx.globalAlpha = "1";
      ctx.fillRect(40 + 30, 30 + 180 + 30, 180, 50, 50);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#ffffff";
      ctx.font = '32px "Poppins-Bold"';
      ctx.textAlign = "center";
      ctx.fillText(LvlText, 40 + 30 + 180 / 2, 30 + 180 + 30 + 38);
      ctx.restore();

      ctx.save();
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#000000";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.font = '39px "Poppins-Bold"';
      ctx.fillText(Username, 390, 80);
      ctx.restore();

      ctx.save();
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#000000";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.font = '55px "Poppins-Bold"';
      ctx.fillText("#" + Rank, canvas.width - 50 - 5, 80);
      ctx.restore();

      ctx.save();
      RoundedBox(ctx, 390, 305, 660, 70, Number(20));
      ctx.strokeStyle = "#BFC85A22";
      ctx.stroke();
      ctx.clip();
      ctx.fillStyle = "#ffffff";
      ctx.font = '45px "Poppins-Bold"';
      ctx.fillText(message.guild.name, 75 + 450, 355);
      ctx.globalAlpha = "0.2";
      ctx.fillRect(390, 305, 660, 70);
      ctx.restore();

      ctx.save();
      RoundedBox(ctx, 390, 145, 660, 50, Number(BarRadius));
      ctx.strokeStyle = "#BFC85A22";
      ctx.stroke();
      ctx.clip();
      ctx.fillStyle = LevelBarBackground;
      ctx.globalAlpha = "0.2";
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
      ctx.globalAlpha = "0.5";
      ctx.fillRect(390, 145, progress, 50, 50);
      ctx.restore();

      ctx.save();
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = "0.8";
      ctx.font = '30px "Poppins-Bold"';
      ctx.fillText("Next Level: " + shortener(NeededXP) + " xp", 390, 230);
      ctx.restore();

      const latestXP = Number(CurrentXP) - Number(NeededXP);
      const textXPEdited = TextXpNeded.replace(/{needed}/g, shortener(NeededXP))
        .replace(/{current}/g, shortener(CurrentXP))
        .replace(/{latest}/g, latestXP);
      ctx.textAlign = "center";
      ctx.fillStyle = "#474747";
      ctx.globalAlpha = 1;
      ctx.font = '30px "Poppins-Bold"';
      ctx.fillText(textXPEdited, 730, 180);

      if (options.slash === true) {
        const attachment = new Discord.MessageAttachment(
          canvas.toBuffer(),
          AttachmentName
        );

        message.followUp({ files: [attachment], ephemeral: true });
      } else if (!options.slash || options.slash === false) {
        const attachment = new Discord.MessageAttachment(
          canvas.toBuffer(),
          AttachmentName
        );

        message.channel.send({ files: [attachment] });
      }
    } catch (err) {
      console.log(`Error Occured. | rankCard | Error: ${err.stack}`);
    }
  }

}

async function lvlRole(message, userID, options = []) {
  let data = options.data

  let user = await levels.findOne({
    user: userID,
    guild: message.guild.id
  });
  if (!user) {
    const newuser = new levels({
      user: userID,
      guild: message.guild.id
    });
  }

  data.forEach(i => {
    if (user && user.level >= Number(i.level)) {
      let u = message.guild.members.cache.get(userID)

      let real = message.guild.roles.cache.find((r) => r.id === i.role)
      if (!real) return
      else {
        u.roles
          .add(real)
          .catch((err) =>
            message.channel.send(
              '[XP] ERROR: Role is higher than me. `MISSING_PERMISSIONS`'
            )
          )
      }
    }
  })

}

module.exports = {
  connect: connect,
  create: create,
  addXP: addXP,
  rank: rank,
  fetch: fetch,
  setXP: setXP,
  lvlRole: lvlRole
}