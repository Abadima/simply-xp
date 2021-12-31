const levels = require('../src/models/level.js')

/**
 * @param {string} userID
 * @param {string} guildID
 */

async function create(userID, guildID) {
  if (!userID) throw new Error('[XP] User ID was not provided.')

  if (!guildID) throw new Error('[XP] User ID was not provided.')

  let uzer = await levels.findOne({ user: userID, guild: guildID })

  if (uzer) return

  const newuser = new levels({
    user: userID,
    guild: guildID
  })
  await newuser
    .save()
    .catch((e) => console.log(`[XP] Failed to save new use to database`))

  return true
}

module.exports = create
