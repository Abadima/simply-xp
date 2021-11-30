const mongoose = require('mongoose')

/**
 * @type {mongoose.Schema<{ user: string, guild: string, xp: number, level:number}>}
 */
const Levelz = new mongoose.Schema({
  user: { type: String },
  guild: { type: String },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 0 }
})

module.exports = mongoose.model('Simply-XP', Levelz)
