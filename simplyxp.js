const Discord = require('discord.js')
const mongoose = require('mongoose')
const levels = require('./models/level.js')
const lrole = require('./models/lvlrole.js')
const { join } = require('path')
const ChartJSImage = require('chart.js-image')

const Canvas = require('canvas')
const { registerFont } = require('canvas')
registerFont(join(__dirname, 'Fonts', 'Poppins-Regular.ttf'), {
  family: 'PoppinsRegular'
})
registerFont(join(__dirname, 'Fonts', 'Poppins-SemiBold.ttf'), {
  family: 'PoppinsBold'
})

/**
 * @type {import('./index').connect}
 */
function connect(db, options = []) {
  if (!db) throw new Error('[XP] Database URL was not provided')

  mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })

  if (options.notify === false) return
  console.log('{ XP } Database Connected')
  return
}

/**
 * @type {import('./index').create}
 */
async function create(userID, guildID) {
  if (!userID) throw new Error('[XP] User ID was not provided.')
  if (!guildID) throw new Error('[XP] User ID was not provided.')

  let user = await levels.findOne({ user: userID, guild: guildID })
  if (user) return user

  const newuser = new levels({
    user: userID,
    guild: guildID
  })

  try {
    user = await newuser.save()
  } catch (e) {
    console.log(`[XP] Failed to save new use to database`)
  }

  return user
}

/**
 * @type {import('./index').addXP}
 */
async function addXP(message, userID, guildID, xp) {
  if (!userID) throw new Error('[XP] User ID was not provided.')
  if (!guildID) throw new Error('[XP] Guild ID was not provided.')
  if (!xp) throw new Error('[XP] XP amount is not provided.')

  const { client } = message

  let xpNum = 0
  if (xp.min || xp.max) {
    if (!xp.min) {
      throw new Error(
        `[XP] XP max amount is provided but min amount is not provided.`
      )
    } else if (!xp.max) {
      throw new Error(
        `[XP] XP min amount is provided but max amount is not provided.`
      )
    }

    let min = Math.abs(Number(xp.min)),
      max = Math.abs(Number(xp.max))

    if (isNaN(min)) throw new Error('[XP] XP amount min is not a number.')
    if (isNaN(max)) throw new Error('[XP] XP amount max is not a number.')
    if (max - min <= 0) throw new Error('[XP] XP max must be bigger than min.')

    xpNum = Math.floor(Math.random() * (max - min) + min)
  } else {
    const num = Number(xp)
    if (isNaN(num)) throw new Error('[XP] XP amount is not a number.')
    xpNum = num
  }

  const user = await create(userID, guildID)

  let oldLevel = user.level,
    newLevel = Math.floor(0.1 * Math.sqrt(user.xp))

  user.xp += xpNum
  user.level = newLevel

  await user
    .save()
    .catch((e) =>
      console.log(`[XP] Failed to add XP | User: ${userID} | Err: ${e}`)
    )

  const xp = user.xp

  if (oldLevel !== newLevel) {
    client.emit('levelUp', message, {
      xp,
      level: newLevel,
      userID,
      guildID
    })
  }

  return user.toJSON()
}

/**
 * @type {import('./index').setXP}
 */
async function setXP(userID, guildID, xp) {
  if (!userID) throw new Error('[XP] User ID was not provided.')
  if (!guildID) throw new Error('[XP] Guild ID was not provided.')
  if (!xpNum) throw new Error('[XP] XP amount is not provided.')

  const xpNum = Number(xp)
  if (isNan(xpNum)) throw new Error('[XP] XP amount is not a number.')

  const user = await create(userID, guildID)

  user.xp = xpNum
  user.level = Math.floor(0.1 * Math.sqrt(user.xp))

  await user
    .save()
    .catch((e) =>
      console.log(`[XP] Failed to set XP | User: ${userID} | Err: ${e}`)
    )

  return user.toJSON()
}

function shortener(count) {
  const COUNT_ABBRS = ['', 'k', 'M', 'T']

  const i = 0 === count ? count : Math.floor(Math.log(count) / Math.log(1000))
  let result = (count / Math.pow(1000, i)).toFixed(2)
  result += `${COUNT_ABBRS[i]}`
  return result
}

/**
 * @type {import('./index').leaderboard}
 */
async function leaderboard(client, guildID, limit) {
  if (!client) throw new Error('[XP] Client was not provided.')
  if (!guildID) throw new Error('[XP] Guild ID was not provided.')
  if (limit && isNan(Number(limit)))
    throw new Error('[XP] Limit is not a number.')

  const guild = await client.guilds.fetch(guildID)
  const leaderboard = await levels
    .find({
      guild: guildID
    })
    .sort([['xp', 'descending']])
    .exec()

  return leaderboard.map((dbUser) => {
    let member = guild.members.cache.get(dbUser.user)
    if (!member) return

    if (dbUser.xp === 0) return

    let pos =
      leaderboard.findIndex(
        (i) => i.guild === dbUser.guild && i.user === dbUser.user
      ) + 1

    if (limit) {
      if (pos > Number(limit)) return
    }

    let shortxp = shortener(dbUser.xp)

    return {
      guildID: dbUser.guild,
      userID: dbUser.user,
      xp: dbUser.xp,
      level: dbUser.level,
      shortxp,
      position: pos,
      username: member.user.username,
      tag: member.user.tag
    }
  })
}

/**
 * @type {import('./index').fetch}
 */
async function fetch(userID, guildID) {
  if (!userID) throw new Error('[XP] User ID was not provided.')
  if (!guildID) throw new Error('[XP] Guild ID was not provided.')

  let user = await create(userID, guildID)

  const leaderboard = await levels
    .find({
      guild: guildID
    })
    .sort([['xp', 'descending']])
    .exec()

  let rank = (position = leaderboard.findIndex((i) => i.user === userID) + 1)

  let targetxp = user.level + 1,
    reqxp = targetxp * targetxp * 100,
    shortxp = shortener(user.xp),
    shortreq = shortener(reqxp)

  return {
    level: user.level,
    xp: user.xp,
    reqxp,
    rank,
    shortxp,
    shortreq
  }
}

/**
 * @type {import('./index').charts}
 */
async function charts(message, options = {}) {
  let { client } = message

  let xpArr = []
  let tagArr = []
  for (let e of await leaderboard(client, message.guild.id)) {
    if (e.position <= 5) {
      xpArr.push(e.xp)
      tagArr.push(e.tag)
    }
  }

  const line_chart = ChartJSImage()
    .chart({
      type: options.type || 'bar',
      data: {
        labels: tagArr,
        datasets: [
          {
            label: 'Leaderboards',
            data: xpArr,
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
 * @type {import('./index').rank}
 */
async function rank(message, userID, guildID, options = []) {
  if (!userID) throw new Error('[XP] User ID was not provided.')

  if (!guildID) throw new Error('[XP] Guild ID was not provided.')

  let user = await create(userID, guildID)

  const leaderboard = await levels
    .find({
      guild: guildID
    })
    .sort([['xp', 'descending']])
    .exec()

  let rank = leaderboard.findIndex((i) => i.user === userID) + 1
  let targetxp = user.level + 1
  let neededXP = targetxp * targetxp * 100

  return rankCard(message, {
    level: user.level,
    currentXP: user.xp,
    neededXP,
    rank,
    member: message.guild.members.cache.get(userID)?.user,
    ...options
  })
}

/**
 * @type {import('./index').rankCard}
 */
async function rankCard(message, options = []) {
  try {
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
    ctx.font = '32px "PoppinsBold"'
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
    ctx.font = '32px "PoppinsBold"'
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
    ctx.font = '39px "PoppinsBold"'
    ctx.fillText(Username, 390, 80)
    ctx.restore()

    ctx.save()
    ctx.textAlign = 'right'
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = '#000000'
    ctx.shadowBlur = 15
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1
    ctx.font = '55px "PoppinsBold"'
    ctx.fillText('#' + Rank, canvas.width - 50 - 5, 80)
    ctx.restore()

    ctx.save()
    RoundedBox(ctx, 390, 305, 660, 70, Number(20))
    ctx.strokeStyle = '#BFC85A22'
    ctx.stroke()
    ctx.clip()
    ctx.fillStyle = '#ffffff'
    ctx.font = `${fsiz} "PoppinsBold"`
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
    ctx.font = '30px "PoppinsBold"'
    ctx.fillText('Next Level: ' + shortener(NeededXP) + ' xp', 390, 230)
    ctx.restore()

    const latestXP = Number(CurrentXP) - Number(NeededXP)
    const textXPEdited = TextXpNeded.replace(/{needed}/g, shortener(NeededXP))
      .replace(/{current}/g, shortener(CurrentXP))
      .replace(/{latest}/g, latestXP)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#474747'
    ctx.globalAlpha = 1
    ctx.font = '30px "PoppinsBold"'
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

class roleSetup {
  /**
   * @param {Discord.Client} client
   * @param {string} guildID
   * @param {import('./index').lvlAddOptions} options
   */
  static async add(client, guildID, options = {}) {
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
   * @param {import('./index').lvlRemoveOptions} options
   */
  static async remove(client, guildID, options = {}) {
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

  /**
   *
   * @param {Discord.Client} client
   * @param {string} guildID
   * @param {import('./index').lvlRemoveOptions} options
   * @returns
   */
  static async fetch(client, guildID, options = {}) {
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
 * @type {import('./index').lvlRole}
 */
async function lvlRole(message, userID, guildID) {
  let lvlRoles = await lrole.find({
    gid: guildID
  })

  if (!lvlRoles || lvlRoles.length === 0) return

  let user = await create(userId, guildID)

  for (let lvlRoleDoc of lvlRoles) {
    let { lvlrole: roles } = lvlRoleDoc
    for (let lvlRole of roles) {
      if (user.level < Number(lvlRole.lvl)) continue

      let member = message.guild.members.cache.get(userID)

      let dscRole = message.guild.roles.cache.find((r) => r.id === lvlRole.role)
      if (!dscRole) {
        lvlRoleDoc.lvlrole = roles.filter((l) => l.role !== lvlRole.role)
        await lvlRoleDoc.save()
        continue
      }

      member.roles.add(dscRole).catch((err) => {
        message.channel.send(
          '[XP] ERROR: Role is higher than me. `MISSING_PERMISSIONS`'
        )
      })
    }
  }
}

module.exports = {
  connect,
  create,
  charts,
  addXP,
  rank,
  fetch,
  setXP,
  leaderboard,
  roleSetup,
  lvlRole
}
