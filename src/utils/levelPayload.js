/**
 * Build the shared payload used when notifying about a level change.
 * @param {Object} user
 * @param {string} userID
 * @param {string} guildID
 * @returns {{xp:number,level:number,userID:string,guildID:string}}
 */
function buildLevelPayload(user, userID, guildID) {
	return {
		xp: user.xp,
		level: user.level,
		userID,
		guildID
	};
}

module.exports = buildLevelPayload;
