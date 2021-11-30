const mongoose = require('mongoose')

/**
 * @type {mongoose.Schema<{ gid: string, lvlrole: ({lvl: string, role:string})[]}>}
 */
const rol = new mongoose.Schema({
  gid: { type: String },
  lvlrole: { type: Array }
})

module.exports = mongoose.model('Simply-XP-LevelRole', rol)
