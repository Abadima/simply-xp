const levels = require('../src/models/level.js')
const lrole = require('../src/models/lvlrole.js')

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

module.exports = lvlRole
