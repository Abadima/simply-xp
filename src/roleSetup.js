const lrole = require('../src/models/lvlrole.js')

class roleSetup {
  /**
   * @param {Discord.Client} client
   * @param {string} guildID
   * @param {import('../index').lvladdOptions} options
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

        return true
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
   * @param {import('../index').lvlremoveOptions} options
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

      return true
    } else throw new Error('Level role with this level does not exist')
  }

  /**
   * @param {Discord.Client} client
   * @param {string} guildID
   */

  static async fetch(client, guildID) {
    let rol = await lrole.find({
      gid: guildID
    })

    if (!rol || rol.length === 0) return

    return rol[0].lvlrole
  }

  /**
   * @param {Discord.Client} client
   * @param {string} guildID
   * @param {string} level
   */

  static async find(client, guildID, level) {
    let rol = await lrole.find({
      gid: guildID
    })

    if (!rol || !rol.length) return
    rol = rol[0].lvlrole.filter((i) => i.lvl == level) || undefined

    if (rol) {
      return rol
    }
  }
}

module.exports = roleSetup
