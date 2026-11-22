const SUFFIXES = ["", "k", "M", "B", "T", "Q", "Q+", "S", "S+", "O", "N", "D", "U"];

/** 1500 -> "1.5k", 400 -> "400" */
function shortener(count) {
	const numericCount = Number(count) || 0;
	const absCount = Math.abs(numericCount);
	const index = absCount === 0 ? 0 : Math.floor(Math.log10(absCount) / 3);
	const safeIndex = Math.min(Math.max(index, 0), SUFFIXES.length - 1);
	const formatted = parseFloat((absCount / Math.pow(1000, safeIndex)).toFixed(2)) + SUFFIXES.at(safeIndex);
	return numericCount < 0 ? "-" + formatted : formatted;
}

module.exports = shortener;
