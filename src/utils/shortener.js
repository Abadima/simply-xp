/**
 * Format a large XP count using common abbreviations.
 * @param {number} count
 * @returns {string}
 */
function shortener(count) {
	const numericCount = Number(count) || 0;
	const isNegative = numericCount < 0;
	const absCount = Math.abs(numericCount);
	const suffixes = ["", "k", "M", "B", "T", "Q", "Q+", "S", "S+", "O", "N", "D", "U"];
	const index = absCount === 0 ? 0 : Math.floor(Math.log10(absCount) / 3);
	const safeIndex = Math.min(Math.max(index, 0), suffixes.length - 1);
	const scaled = absCount / Math.pow(1000, safeIndex);
	const formatted = scaled.toFixed(2) + suffixes[safeIndex];
	return isNegative ? "-" + formatted : formatted;
}

module.exports = shortener;
