/** The level an XP total reaches. */
function levelForXP(xp) {
	return Math.floor(0.1 * Math.sqrt(xp));
}

/** The XP a level starts at; negative levels count as 0. */
function xpForLevel(level) {
	return (10 * Math.max(0, level)) ** 2;
}

module.exports = { levelForXP, xpForLevel };
