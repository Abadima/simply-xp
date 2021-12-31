const levels = require('../src/models/level.js')

/**
 * @param {string} userID
 * @param {string} guildID
 */

async function reset(userID, guildID) {
  if (!userID) throw new Error('[XP] User ID was not provided.')

  if (!guildID) throw new Error('[XP] User ID was not provided.')

  let uzer = await levels.findOne({ user: userID, guild: guildID })

  uzer = new levels({
    user: userID,
    guild: guildID,
    xp: 0,
    lvl: 0
  })
  await uzer
    .save()
    .catch((e) => console.log(`[XP] Failed to save new use to database`))

  return true
}

module.exports = reset
