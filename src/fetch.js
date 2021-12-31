const levels = require('../src/models/level.js')

/**
 * @param {string} userID
 * @param {string} guildID
 */

async function fetch(userID, guildID) {
  if (!userID) throw new Error('[XP] User ID was not provided.')

  if (!guildID) throw new Error('[XP] Guild ID was not provided.')

  let user = await levels.findOne({
    user: userID,
    guild: guildID
  })
  if (!user) {
    user = new levels({
      user: userID,
      guild: guildID,
      xp: 0,
      level: 0
    })

    await user.save()
  }

  const leaderboard = await levels
    .find({
      guild: guildID
    })
    .sort([['xp', 'descending']])
    .exec()

  if (user === null)
    return {
      level: 0,
      xp: 0,
      reqxp: 100,
      rank: leaderboard.findIndex((i) => i.user === userID) + 1,
      shortxp: 0,
      shortreq: 100
    }

  user.position = leaderboard.findIndex((i) => i.user === userID) + 1

  let targetxp = user.level + 1

  let target = targetxp * targetxp * 100

  function shortener(count) {
    const COUNT_ABBRS = ['', 'k', 'M', 'T']

    const i = 0 === count ? count : Math.floor(Math.log(count) / Math.log(1000))
    let result = parseFloat((count / Math.pow(1000, i)).toFixed(2))
    result += `${COUNT_ABBRS[i]}`
    return result
  }

  let shortXP = shortener(user.xp)

  let shortReqXP = shortener(target)

  return {
    level: user.level,
    xp: user.xp,
    reqxp: target,
    rank: user.position,
    shortxp: shortXP,
    shortreq: shortReqXP
  }
}

module.exports = fetch
