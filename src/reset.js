const levels = require('../src/models/level.js')

/**
 * @param {string} userID
 * @param {string} guildID
 */

async function reset(userID, guildID) {
  if (!userID) throw new Error('[XP] User ID was not provided.')

  if (!guildID) throw new Error('[XP] User ID was not provided.')

  await levels
    .findOneAndUpdate({ user: userID, guild: guildID }, { xp: 0, level: 0 })
    .catch((err) => {
      throw new Error(err)
    })

  return { user: userID, guild: guildID, xp: 0, level: 0 }
}

module.exports = reset
