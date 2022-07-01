try {
  require('discord.js')
} catch (e) {
  console.warn(
    '[XP] DJS V13 is recommended for this package. \n Debug Notice: \n' + e
  )
}

module.exports.roleSetup = require('./src/roleSetup')

module.exports.addLevel = require('./src/addLevel')

module.exports.addXP = require('./src/addXP')

module.exports.charts = require('./src/charts')

module.exports.connect = require('./src/connect')

module.exports.create = require('./src/create')

module.exports.fetch = require('./src/fetch')

module.exports.leaderboard = require('./src/leaderboard')

module.exports.lvlRole = require('./src/lvlRole')

module.exports.rank = require('./src/rank')

module.exports.setLevel = require('./src/setLevel')

module.exports.setXP = require('./src/setXP')

module.exports.reset = require('./src/reset')
