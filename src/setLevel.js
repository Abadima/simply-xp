const levels = require('../src/models/level.js')
let { roleSetup } = require('../simplyxp')

/**
 * @param {Discord.Message} message
 * @param {string} userID
 * @param {string} guildID
 * @param {string} level
 */
async function setLevel(message, userID, guildID, level) {
  if (!userID) throw new Error('[XP] User ID was not provided.')

  if (!guildID) throw new Error('[XP] Guild ID was not provided.')

  if (!level) throw new Error('[XP] Level amount is not provided.')

  let { client } = message

  const user = await levels.findOne({ user: userID, guild: guildID })

  if (!user) {
    const newUser = new levels({
      user: userID,
      guild: guildID,
      xp: 0,
      level: 0
    })

    await newUser
      .save()
      .catch((e) => console.log(`[XP] Failed to save new user to database`))

    let xp = (level * 10) ** 2

    return {
      level: level,
      exp: xp
    }
  }
  let level1 = user.level

  user.xp = (level * 10) ** 2
  user.level = Math.floor(0.1 * Math.sqrt(user.xp))

  await user
    .save()
    .catch((e) =>
      console.log(`[XP] Failed to set Level | User: ${userID} | Err: ${e}`)
    )

  if (level1 !== level) {
    let data = {
      xp: user.xp,
      level: user.level,
      userID,
      guildID
    }

    let role = await roleSetup.find(client, guildID, level)

    client.emit('levelUp', message, data, role)
  }

  return {
    level: user.level,
    xp: user.xp
  }
}

module.exports = setLevel
