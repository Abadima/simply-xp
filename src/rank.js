let Discord = require('discord.js')
const levels = require('../src/models/level.js')
const { join } = require('path')

/**
 * @param {Discord.Message} message
 * @param {string} userID
 * @param {string} guildID
 * @param {import('../index').rankOptions} options
 */

async function rank(message, userID, guildID, options = []) {
  if (!userID) throw new Error('[XP] User ID was not provided.')

  if (!guildID) throw new Error('[XP] Guild ID was not provided.')

  const user = await levels.findOne({
    user: userID,
    guild: guildID
  })
  if (!user) console.error('[XP] NO_DATA | User has no XP data.')

  const leaderboard = await levels
    .find({
      guild: guildID
    })
    .sort([['xp', 'descending']])
    .exec()

  user.position = leaderboard.findIndex((i) => i.user === userID) + 1

  let targetxp = user.level + 1

  let target = targetxp * targetxp * 100

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
  })

  async function rankCard(message, options = []) {
    try {
      const Canvas = require('canvas')
      const { registerFont } = require('canvas')
      registerFont(join(__dirname, 'Fonts', 'Baloo-Regular.ttf'), { family: 'Sans Serif' })

      function shortener(count) {
        const COUNT_ABBRS = ['', 'k', 'M', 'T']

        const i =
          0 === count ? count : Math.floor(Math.log(count) / Math.log(1000))
        let result = parseFloat((count / Math.pow(1000, i)).toFixed(2))
        result += `${COUNT_ABBRS[i]}`
        return result
      }

      const member = options.member

      const canvas = Canvas.createCanvas(1080, 400),
        ctx = canvas.getContext('2d')

      const name = member.tag
      const noSymbols = (string) => string.replace(/[\u007f-\uffff]/g, '')

      let fsiz = '45px'
      if (message.guild.name.length >= 23) {
        fsiz = '38px'
      }
      if (message.guild.name.length >= 40) {
        fsiz = '28px'
      }
      if (message.guild.name.length >= 63) {
        fsiz = '22px'
      }

      let BackgroundRadius = '20',
        BackGroundImg =
          options.background ||
          'https://pinebanana.files.wordpress.com/2011/04/rainbow.jpg',
        AttachmentName = 'rank.png',
        Username = noSymbols(name),
        AvatarRoundRadius = '50',
        DrawLayerColor = '#000000',
        DrawLayerOpacity = '0.4',
        BoxColor = options.color || '#096DD1',
        LevelBarFill = options.lvlbar || '#ffffff',
        LevelBarBackground = options.lvlbarBg || '#ffffff',
        Rank = options.rank,
        TextEXP = shortener(options.currentXP) + ' XP',
        LvlText = `Level ${shortener(options.level)}`,
        BarRadius = '20',
        TextXpNeded = '{current}/{needed}',
        CurrentXP = options.currentXP,
        NeededXP = options.neededXP

      ctx.beginPath()
      ctx.moveTo(0 + Number(BackgroundRadius), 0)
      ctx.lineTo(0 + 1080 - Number(BackgroundRadius), 0)
      ctx.quadraticCurveTo(0 + 1080, 0, 0 + 1080, 0 + Number(BackgroundRadius))
      ctx.lineTo(0 + 1080, 0 + 400 - Number(BackgroundRadius))
      ctx.quadraticCurveTo(
        0 + 1080,
        0 + 400,
        0 + 1080 - Number(BackgroundRadius),
        0 + 400
      )

      ctx.lineTo(0 + Number(BackgroundRadius), 0 + 400)
      ctx.quadraticCurveTo(0, 0 + 400, 0, 0 + 400 - Number(BackgroundRadius))
      ctx.lineTo(0, 0 + Number(BackgroundRadius))
      ctx.quadraticCurveTo(0, 0, 0 + Number(BackgroundRadius), 0)
      ctx.closePath()
      ctx.clip()
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, 1080, 400)
      let background = await Canvas.loadImage(BackGroundImg)
      ctx.globalAlpha = 0.7
      ctx.drawImage(background, 0, 0, 1080, 400)
      ctx.restore()

      ctx.fillStyle = DrawLayerColor
      ctx.globalAlpha = DrawLayerOpacity
      ctx.fillRect(40, 0, 240, canvas.height)
      ctx.globalAlpha = 1

      function RoundedBox(ctx, x, y, width, height, radius) {
        ctx.beginPath()
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + width - radius, y)
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
        ctx.lineTo(x + width, y + height - radius)
        ctx.quadraticCurveTo(
          x + width,
          y + height,
          x + width - radius,
          y + height
        )
        ctx.lineTo(x + radius, y + height)
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
        ctx.lineTo(x, y + radius)
        ctx.quadraticCurveTo(x, y, x + radius, y)
        ctx.closePath()
      }

      let avatar = await Canvas.loadImage(
        member.displayAvatarURL({ dynamic: true, format: 'png' })
      )
      ctx.save()
      RoundedBox(ctx, 40 + 30, 30, 180, 180, Number(AvatarRoundRadius))
      ctx.strokeStyle = BoxColor
      ctx.lineWidth = '10'
      ctx.stroke()
      ctx.clip()
      ctx.drawImage(avatar, 40 + 30, 30, 180, 180)
      ctx.restore()

      ctx.save()
      RoundedBox(ctx, 40 + 30, 30 + 180 + 30 + 50 + 30, 180, 50, 20)
      ctx.strokeStyle = '#BFC85A22'
      ctx.stroke()
      ctx.clip()
      ctx.fillStyle = BoxColor
      ctx.globalAlpha = '1'
      ctx.fillRect(40 + 30, 30 + 180 + 30 + 50 + 30, 180, 50)
      ctx.globalAlpha = 1
      ctx.fillStyle = '#ffffff'
      ctx.font = '32px "Sans Serif"'
      ctx.textAlign = 'center'
      ctx.fillText(TextEXP, 40 + 30 + 180 / 2, 30 + 180 + 30 + 30 + 50 + 38)
      ctx.restore()

      ctx.save()
      RoundedBox(ctx, 40 + 30, 30 + 180 + 30, 180, 50, 20)
      ctx.strokeStyle = '#BFC85A22'
      ctx.stroke()
      ctx.clip()
      ctx.fillStyle = BoxColor
      ctx.globalAlpha = '1'
      ctx.fillRect(40 + 30, 30 + 180 + 30, 180, 50, 50)
      ctx.globalAlpha = 1
      ctx.fillStyle = '#ffffff'
      ctx.font = '32px "Sans Serif"'
      ctx.textAlign = 'center'
      ctx.fillText(LvlText, 40 + 30 + 180 / 2, 30 + 180 + 30 + 38)
      ctx.restore()

      ctx.save()
      ctx.textAlign = 'left'
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = '#000000'
      ctx.shadowBlur = 15
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1
      ctx.font = '39px "Sans Serif"'
      ctx.fillText(Username, 390, 80)
      ctx.restore()

      ctx.save()
      ctx.textAlign = 'right'
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = '#000000'
      ctx.shadowBlur = 15
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1
      ctx.font = '55px "Sans Serif"'
      ctx.fillText('#' + Rank, canvas.width - 50 - 5, 80)
      ctx.restore()

      ctx.save()
      RoundedBox(ctx, 390, 305, 660, 70, Number(20))
      ctx.strokeStyle = '#BFC85A22'
      ctx.stroke()
      ctx.clip()
      ctx.fillStyle = '#ffffff'
      ctx.font = `${fsiz} "Sans Serif"`
      ctx.textAlign = 'center'
      ctx.fillText(message.guild.name, 60 + 660, 355)
      ctx.globalAlpha = '0.2'
      ctx.fillRect(390, 305, 660, 70)
      ctx.restore()

      ctx.save()
      RoundedBox(ctx, 390, 145, 660, 50, Number(BarRadius))
      ctx.strokeStyle = '#BFC85A22'
      ctx.stroke()
      ctx.clip()
      ctx.fillStyle = LevelBarBackground
      ctx.globalAlpha = '0.2'
      ctx.fillRect(390, 145, 660, 50, 50)
      ctx.restore()

      const percent = (100 * CurrentXP) / NeededXP
      const progress = (percent * 660) / 100

      ctx.save()
      RoundedBox(ctx, 390, 145, progress, 50, Number(BarRadius))
      ctx.strokeStyle = '#BFC85A22'
      ctx.stroke()
      ctx.clip()
      ctx.fillStyle = LevelBarFill
      ctx.globalAlpha = '0.5'
      ctx.fillRect(390, 145, progress, 50, 50)
      ctx.restore()

      ctx.save()
      ctx.textAlign = 'left'
      ctx.fillStyle = '#ffffff'
      ctx.globalAlpha = '0.8'
      ctx.font = '30px "Sans Serif"'
      ctx.fillText('Next Level: ' + shortener(NeededXP) + ' XP', 390, 230)
      ctx.restore()

      const latestXP = Number(CurrentXP) - Number(NeededXP)
      const textXPEdited = TextXpNeded.replace(/{needed}/g, shortener(NeededXP))
        .replace(/{current}/g, shortener(CurrentXP))
        .replace(/{latest}/g, latestXP)
      ctx.textAlign = 'center'
      ctx.fillStyle = '#474747'
      ctx.globalAlpha = 1
      ctx.font = '30px "Sans Serif"'
      ctx.fillText(textXPEdited, 730, 180)

      const attachment = new Discord.MessageAttachment(
        canvas.toBuffer(),
        AttachmentName
      )

      return attachment
    } catch (err) {
      console.log(`[XP] Error Occured. | rankCard | Error: ${err.stack}`)
    }
  }
}

module.exports = rank
