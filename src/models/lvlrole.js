const mongoose = require('mongoose')

const rol = new mongoose.Schema({
  gid: { type: String },
  lvlrole: { type: Array }
})

module.exports = mongoose.model('Simply-XP-LevelRole', rol)
