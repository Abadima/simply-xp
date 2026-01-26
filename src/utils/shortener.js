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

	const i = 0 === count ? count : Math.floor(Math.log(count) / Math.log(1000));
	let result = parseFloat((count / Math.pow(1000, i)).toFixed(2));
	result += `${COUNT_ABBRS[i]}`;
	return result;
}

module.exports = shortener;
