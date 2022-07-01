const levels = require('../src/models/level.js')
let { roleSetup } = require('../simplyxp')

/**
 * @param {Discord.Message} message
 * @param {string} userID
 * @param {string} guildID
 * @param {number} xp
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

    let role = await roleSetup.find(client, guildID, level)

    client.emit('levelUp', message, data, role)
  }

  return {
    level,
    xp
  }
}

module.exports = addXP
