const levels = require('../src/models/level.js')

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

module.exports = setXP
