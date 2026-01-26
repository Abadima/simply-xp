function buildLevelPayload(user, userID, guildID) {
    return {
        xp: user.xp,
        level: user.level,
        userID,
        guildID
    };
}

module.exports = buildLevelPayload;
