/**
 * Format a large XP count using common abbreviations.
 * @param {number} count
 * @returns {string}
 */
function shortener(count) {
    const numericCount = Number(count) || 0;
    const suffixes = ["", "k", "M", "B", "T", "Q", "Q+", "S", "S+", "O", "N", "D", "U"];
    const index = numericCount === 0 ? 0 : Math.floor(Math.log10(numericCount) / 3);
    const safeIndex = Math.min(Math.max(index, 0), suffixes.length - 1);
    return (numericCount / Math.pow(1000, safeIndex)).toFixed(2) + suffixes[safeIndex];
}

module.exports = shortener;
