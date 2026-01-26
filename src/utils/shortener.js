/**
 * Format a large XP count using common abbreviations.
 * @param {number} count
 * @returns {string}
 */
function shortener(count) {
    const COUNT_ABBRS = [
        "",
        "k",
        "M",
        "B",
        "T",
        "Q",
        "Q+",
        "S",
        "S+",
        "O",
        "N",
        "D",
        "U"
    ];

    const numericCount = Number(count) || 0;
    const rawIndex = numericCount === 0 ? 0 : Math.floor(Math.log(numericCount) / Math.log(1000));
    const safeIndex = Math.max(0, Math.min(rawIndex, COUNT_ABBRS.length - 1));
    let result = parseFloat((numericCount / Math.pow(1000, safeIndex)).toFixed(2));
    result += COUNT_ABBRS[safeIndex];
    return result;
}

module.exports = shortener;
