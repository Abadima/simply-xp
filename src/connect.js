const mongoose = require('mongoose')

/**
 * @param {string} db
 * @param {import('../index').connectOptions} options
 */

async function connect(db, options = []) {
  if (!db) throw new Error('[XP] Database URL was not provided')

  mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })

  if (options.notify === false) return
  else return console.log('{ XP } Database Connected')
}

module.exports = connect
