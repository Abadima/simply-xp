let Discord = require('discord.js')
const mongoose = require('mongoose')
const levels = require('./models/level.js')
const lrole = require('./models/lvlrole.js')
const { join } = require('path')

/**
 * @param {string} db
 * @param {import('./index').connectOptions} options
 */

async function connect(db, options = []) {
  if (!db) throw new Error('[XP] Database URL was not provided')

  mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })

  if (options.notify === false) return
  else return console.log('{ XP } Database Connected')
}

/**
 * @param {string} userID
 * @param {string} guildID
 */

async function create(userID, guildID) {
  if (!userID) throw new Error('[XP] User ID was not provided.')

  if (!guildID) throw new Error('[XP] User ID was not provided.')

  let uzer = await levels.findOne({ user: userID, guild: guildID })

  if (uzer) return false

  const newuser = new levels({
    user: userID,
    guild: guildID
  })
  await newuser
    .save()
    .catch((e) => console.log(`[XP] Failed to save new use to database`))

  return true
}

/**
 * @param {string} userID
 * @param {string} guildID
 * @param {string} xp
 */

async function addXP(message, userID, guildID, xp) {
  if (!userID) throw new Error('[XP] User ID was not provided.')

  if (!guildID) throw new Error('[XP] Guild ID was not provided.')

  if (!xp) throw new Error('[XP] XP amount is not provided.')

  let { client } = message

  let min
  let max
  if (xp.min) {
    if (!xp.max)
      throw new Error(
        '[XP] XP min amount is provided but max amount is not provided.'
      )

    min = Number(xp.min)

    if (Number(xp.min).toString() === 'NaN')
      throw new Error('[XP] XP amount (min) is not a number.')
  }

  if (xp.max) {
    if (!xp.min)
      throw new Error(
        '[XP] XP max amount is provided but min amount is not provided.'
      )

    max = Number(xp.max)

    if (Number(xp.max).toString() === 'NaN')
      throw new Error('[XP] XP amount (max) is not a number.')
  }

  if (xp.min && xp.max) {
    let randomNumber = Math.floor(Math.random() * (max - min) + min)

    xp = randomNumber
  }

  const user = await levels.findOne({ user: userID, guild: guildID })

  let lvl = Math.floor(0.1 * Math.sqrt(xp))

  if (!user) {
    const newUser = new levels({
      user: userID,
      guild: guildID,
      xp: xp,
      level: lvl
    })

    await newUser
      .save()
      .catch((e) => console.log(`[XP] Failed to save new user to database`))

    return {
      level: 0,
      exp: 0
    }
  }
  let level1 = user.level

  user.xp += parseInt(xp, 10)
  user.level = Math.floor(0.1 * Math.sqrt(user.xp))

  await user
    .save()
    .catch((e) =>
      console.log(`[XP] Failed to add XP | User: ${userID} | Err: ${e}`)
    )

  let level = user.level

  xp = user.xp

  if (user.xp === 0 || Math.sign(user.xp) === -1) {
    xp = 0
  }

  if (level1 !== level) {
    let data = {
      xp,
      level,
      userID,
      guildID
    }

    client.emit('levelUp', message, data)
  }

  return {
    level,
    xp
  }
}

/**
 * @param {string} userID
 * @param {string} guildID
 * @param {string} xp
 */

async function setXP(userID, guildID, xp) {
  if (!userID) throw new Error('[XP] User ID was not provided.')

  if (!guildID) throw new Error('[XP] Guild ID was not provided.')

  if (!xp) throw new Error('[XP] XP amount is not provided.')

  if (Number(xp).toString() === 'NaN')
    throw new Error('[XP] XP amount is not a number.')

  const user = await levels.findOne({ user: userID, guild: guildID })

  let lvl = Math.floor(0.1 * Math.sqrt(xp))

  if (!user) {
    const newUser = new levels({
      user: userID,
      guild: guildID,
      xp: xp,
      level: lvl
    })

    await newUser
      .save()
      .catch((e) => console.log(`[XP] Failed to save new use to database`))

    return {
      xp: 0
    }
  }
  user.xp = xp
  user.level = Math.floor(0.1 * Math.sqrt(user.xp))

  await user
    .save()
    .catch((e) =>
      console.log(`[XP] Failed to set XP | User: ${userID} | Err: ${e}`)
    )

  return { xp }
}

/**
 * @param {Discord.Client} client
 * @param {string} guildID
 */

async function leaderboard(client, guildID, limit) {
  if (!guildID) throw new Error('[XP] Guild ID was not provided.')

  let g = client.guilds.cache.get(guildID)

  let wo = g.members.cache.size

  let leaderboard = await levels
    .find({
      guild: guildID
    })
    .sort([['xp', 'descending']])
    .exec()

  const led = []

  function shortener(count) {
    const COUNT_ABBRS = ['', 'k', 'M', 'T']

    const i = 0 === count ? count : Math.floor(Math.log(count) / Math.log(1000))
    let result = parseFloat((count / Math.pow(1000, i)).toFixed(2))
    result += `${COUNT_ABBRS[i]}`
    return result
  }

  leaderboard.map((key) => {
    let user = g.members.cache.get(key.user)
    if (key.xp === 0) return

    let pos =
      leaderboard.findIndex(
        (i) => i.guild === key.guild && i.user === key.user
      ) + 1

    if (limit) {
      if (pos > Number(limit)) return
    }

    let shortXP = shortener(key.xp)

    if (!user) return

    led.push({
      guildID: key.guild,
      userID: key.user,
      xp: key.xp,
      shortxp: shortXP,
      level: key.level,
      position: pos,
      username: user.user.username,
      tag: user.user.tag
    })
  })

  return led
}

/**
 * @param {string} userID
 * @param {string} guildID
 */

async function fetch(userID, guildID) {
  if (!userID) throw new Error('[XP] User ID was not provided.')

  if (!guildID) throw new Error('[XP] Guild ID was not provided.')

  let user = await levels.findOne({
    user: userID,
    guild: guildID
  })
  if (!user) {
    user = new levels({
      user: userID,
      guild: guildID,
      xp: 0,
      level: 0
    })

    await user.save()
  }

  const leaderboard = await levels
    .find({
      guild: guildID
    })
    .sort([['xp', 'descending']])
    .exec()

  if (user === null)
    return {
      level: 0,
      xp: 0,
      reqxp: 100,
      rank: leaderboard.findIndex((i) => i.user === userID) + 1,
      shortxp: 0,
      shortreq: 100
    }

  user.position = leaderboard.findIndex((i) => i.user === userID) + 1

  let targetxp = user.level + 1

  let target = targetxp * targetxp * 100

  function shortener(count) {
    const COUNT_ABBRS = ['', 'k', 'M', 'T']

    const i = 0 === count ? count : Math.floor(Math.log(count) / Math.log(1000))
    let result = parseFloat((count / Math.pow(1000, i)).toFixed(2))
    result += `${COUNT_ABBRS[i]}`
    return result
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

/**
 * @param {Discord.Message} message
 * @param {import('./index').chartsOptions} options
 */

async function charts(message, options = []) {
  let { client } = message
  const ChartJSImage = require('chart.js-image')

  let data = []
  let uzern = []

  await leaderboard(client, message.guild.id).then((e) => {
    e.forEach((m) => {
      if (m.position <= 5) {
        data.push(m.xp)
        uzern.push(m.tag)
      }
    })
  })

  const line_chart = ChartJSImage()
    .chart({
      type: options.type || 'bar',
      data: {
        labels: uzern,
        datasets: [
          {
            label: 'Leaderboards',
            data: data,
            backgroundColor: [
              'rgba(255, 99, 132, 0.5)',
              'rgba(255, 159, 64, 0.5)',
              'rgba(255, 205, 86, 0.5)',
              'rgba(75, 192, 192, 0.5)',
              'rgba(54, 162, 235, 0.5)',
              'rgba(153, 102, 255, 0.5)',
              'rgb(201, 203, 207, 0.5)'
            ],
            borderColor: [
              'rgb(255, 99, 132)',
              'rgb(255, 159, 64)',
              'rgb(255, 205, 86)',
              'rgb(75, 192, 192)',
              'rgb(54, 162, 235)',
              'rgb(153, 102, 255)',
              'rgb(201, 203, 207)'
            ],
            borderWidth: 2
          }
        ]
      },
      options: {
        plugins: {
          legend: {
            labels: {
              font: {
                family: 'Courier New'
              }
            }
          }
        },
        title: {
          display: true,
          text: 'XP Datasheet'
        }
      }
    })
    .backgroundColor(options.background || '#2F3136')
    .width(940) // 500px
    .height(520) // 300px

  const attachment = new Discord.MessageAttachment(
    line_chart.toURL(),
    `chart.png`
  )
  return attachment
}

/**
 * @param {Discord.Message} message
 * @param {string} userID
 * @param {string} guildID
 * @param {import('./index').rankOptions} options
 */

async function rank(message, userID, guildID, options = []) {
  if (!userID) throw new Error('[XP] User ID was not provided.')

  if (!guildID) throw new Error('[XP] Guild ID was not provided.')

  const user = await levels.findOne({
    user: userID,
    guild: guildID
  })
  if (!user) throw new Error('[XP] NO_DATA | User has no XP data.')

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
    member: message.guild.members.cache.get(userID)?.user
  })

  async function rankCard(message, options = []) {
    try {
      const Canvas = require('canvas')
      const { registerFont } = require('canvas')
      registerFont('./Fonts/Poppins-SemiBold.ttf', {
        family: 'Poppins-Regular'
      })
      registerFont('./Fonts/Poppins-SemiBold.ttf', {
        family: 'Poppins-Bold'
      })

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
          'https://media.discordapp.net/attachments/868506665102762034/876750913866461185/photo-1579546929518-9e396f3cc809.png?width=640&height=427',
        AttachmentName = 'rank.png',
        Username = noSymbols(name),
        AvatarRoundRadius = '50',
        DrawLayerColor = '#000000',
        DrawLayerOpacity = '0.4',
        BoxColor = options.color || '#096DD1',
        LevelBarFill = options.lvlbar || '#ffffff',
        LevelBarBackground = options.lvlbarBg || '#ffffff',
        Rank = options.rank,
        TextEXP = shortener(options.currentXP) + ' xp',
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
      ctx.font = '32px "Poppins-Bold"'
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
      ctx.font = '32px "Poppins-Bold"'
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
      ctx.font = '39px "Poppins-Bold"'
      ctx.fillText(Username, 390, 80)
      ctx.restore()

      ctx.save()
      ctx.textAlign = 'right'
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = '#000000'
      ctx.shadowBlur = 15
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1
      ctx.font = '55px "Poppins-Bold"'
      ctx.fillText('#' + Rank, canvas.width - 50 - 5, 80)
      ctx.restore()

      ctx.save()
      RoundedBox(ctx, 390, 305, 660, 70, Number(20))
      ctx.strokeStyle = '#BFC85A22'
      ctx.stroke()
      ctx.clip()
      ctx.fillStyle = '#ffffff'
      ctx.font = `${fsiz} "Poppins-Bold"`
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
      ctx.font = '30px "Poppins-Bold"'
      ctx.fillText('Next Level: ' + shortener(NeededXP) + ' xp', 390, 230)
      ctx.restore()

      const latestXP = Number(CurrentXP) - Number(NeededXP)
      const textXPEdited = TextXpNeded.replace(/{needed}/g, shortener(NeededXP))
        .replace(/{current}/g, shortener(CurrentXP))
        .replace(/{latest}/g, latestXP)
      ctx.textAlign = 'center'
      ctx.fillStyle = '#474747'
      ctx.globalAlpha = 1
      ctx.font = '30px "Poppins-Bold"'
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

class roleSetup {
  /**
   * @param {Discord.Client} client
   * @param {string} guildID
   * @param {import('./index').lvladdOptions} options
   */

  static async add(client, guildID, options = []) {
    let rol = await lrole.findOne({
      gid: guildID,
      lvlrole: {
        lvl: options.level,
        role: options.role
      }
    })

    let g = client.guilds.cache.get(guildID)

    let roll = g.roles.cache.find((r) => r.id === options.role)

    if (roll) {
      if (rol) throw new Error('Level Already Exist. Use delete')
      else if (!rol) {
        let newrol = await lrole.findOne({
          gid: guildID
        })

        if (!newrol) {
          newrol = new lrole({
            gid: guildID,
            lvlrole: []
          })

          await newrol.save()
        }

        newrol.lvlrole.push({ lvl: options.level, role: options.role })

        await newrol
          .save()
          .catch((e) =>
            console.log(`[XP] Failed to add lvlrole to database | ${e}`)
          )

        return 'Added the role to levelRole'
      }
    } else {
      throw new Error(
        'Role ID is invalid. | ' +
          `Guild ID: ${guildID} | Role ID: ${options.role}`
      )
    }
  }

  /**
   * @param {Discord.Client} client
   * @param {string} guildID
   * @param {import('./index').lvlremoveOptions} options
   */

  static async remove(client, guildID, options = []) {
    let rol = await lrole.find({
      gid: guildID
    })

    if (!rol || rol.length === 0)
      throw new Error('Level role with this level does not exist')
    rol = rol[0].lvlrole.find((item) => item.lvl === options.level) || undefined

    if (rol) {
      let newrol = await lrole.findOneAndUpdate(
        {
          gid: guildID
        },
        {
          $pull: { lvlrole: { lvl: options.level } }
        }
      )

      return 'Deleting the role from levelRole'
    } else throw new Error('Level role with this level does not exist')
  }

  static async fetch(client, guildID, options = []) {
    let rol = await lrole.find({
      gid: guildID
    })

    if (!rol || rol.length === 0)
      throw new Error('There is no levelRole in this guild')
    rol = rol[0].lvlrole.find((item) => item.lvl === options.level) || undefined

    if (rol) {
      return rol[0].lvlrole
    }
  }
}

/**
 * @param {Discord.Message} message
 * @param {string} userID
 * @param {string} guildID
 */

async function lvlRole(message, userID, guildID) {
  let e = await lrole.find({
    gid: guildID
  })

  if (!e) return

  let user = await levels.findOne({
    user: userID,
    guild: guildID
  })
  if (!user) {
    const newuser = new levels({
      user: userID,
      guild: guildID
    })

    await newuser
      .save()
      .catch((e) => console.log(`[XP] Failed to save new user to database`))
  }

  e.forEach((ee) => {
    ee = ee.lvlrole

    ee.forEach((xd) => {
      if (user && user.level >= Number(xd.lvl)) {
        let u = message.guild.members.cache.get(userID)

        let real = message.guild.roles.cache.find((r) => r.id === xd.role)
        if (!real) return
        else {
          u.roles.add(real).catch((err) => {
            message.channel.send(
              '[XP] ERROR: Role is higher than me. `MISSING_PERMISSIONS`'
            )
          })
        }
      }
    })
  })
}

module.exports = {
  connect: connect,
  create: create,
  charts: charts,
  addXP: addXP,
  rank: rank,
  fetch: fetch,
  setXP: setXP,
  leaderboard: leaderboard,
  roleSetup: roleSetup,
  lvlRole: lvlRole
}
