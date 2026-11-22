const useFont = require("./core/font");

const WIDTH = 950;
const CARTESIAN_HEIGHT = 526;
const RADIAL_HEIGHT = 950;
/** Absorbs float error so a value sitting exactly on a tick does not get an extra one. */
const FLOAT_NOISE = 10 ** -9;
const TITLE = "XP Datasheet";
const DATASET_LABEL = "Leaderboards";
const DEFAULT_BACKGROUND = "#2F3136";
const PALETTE = [
	[255, 99, 132],
	[255, 159, 64],
	[255, 205, 86],
	[75, 192, 192],
	[54, 162, 235],
	[153, 102, 255],
	[201, 203, 207]
];

const fill = (i) => `rgba(${PALETTE[i % PALETTE.length].join(", ")}, 0.5)`;
const stroke = (i) => `rgb(${PALETTE[i % PALETTE.length].join(", ")})`;

const formatValue = (value) => value.toLocaleString("en-US", { maximumFractionDigits: 6 });

/** Text and grid colors readable on the background. */
function themeFor(ctx, background) {
	ctx.fillStyle = background;
	const parsed = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(ctx.fillStyle) ?? [];
	const [red, green, blue] = parsed.slice(1).map((channel) => parseInt(channel, 16));
	const light = red * 0.299 + green * 0.587 + blue * 0.114 > 150;

	return light
		? { text: "#3b3d42", grid: "rgba(0, 0, 0, 0.1)" }
		: { text: "#c7c9cc", grid: "rgba(255, 255, 255, 0.1)" };
}

/** Axis ticks from 0 to a round maximum at or above `max`. */
function niceScale(max, wantedTicks) {
	const target = max > 0 ? max : 1;
	const raw = target / wantedTicks;
	const magnitude = 10 ** Math.floor(Math.log10(raw));
	const residual = raw / magnitude;
	const step = (residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10) * magnitude;
	const top = Math.ceil(target / step - FLOAT_NOISE) * step;

	const ticks = [];
	for (let tick = 0; tick <= top + step / 2; tick += step) ticks.push(Number(tick.toFixed(10)));
	return { max: ticks[ticks.length - 1], ticks };
}

/** Shortens text with an ellipsis until it fits `maxWidth`. */
function fitText(ctx, text, maxWidth) {
	if (ctx.measureText(text).width <= maxWidth) return text;

	let shortened = text;
	while (shortened.length > 1 && ctx.measureText(shortened + "…").width > maxWidth)
		shortened = shortened.slice(0, -1);
	return shortened + "…";
}

/** Text outlined in the background color. */
function drawOutlinedText(ctx, theme, background, text, x, y) {
	ctx.lineWidth = 3;
	ctx.lineJoin = "round";
	ctx.strokeStyle = background;
	ctx.strokeText(text, x, y);
	ctx.fillStyle = theme.text;
	ctx.fillText(text, x, y);
}

/** Draws the title and a wrapping legend; returns where the chart starts. */
function drawHeader(ctx, font, theme, width, legend) {
	ctx.fillStyle = theme.text;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.font = font(15);
	ctx.fillText(TITLE, width / 2, 20);

	ctx.font = font(13);
	const BOX_WIDTH = 40;
	const BOX_HEIGHT = 12;
	const GAP = 10;
	const ROW_HEIGHT = 22;
	const items = legend.map(({ label, index }) => ({
		text: fitText(ctx, label, 260),
		index,
		width: BOX_WIDTH + 8 + ctx.measureText(fitText(ctx, label, 260)).width
	}));

	const rows = [[]];
	let rowWidth = 0;
	for (const item of items) {
		if (rowWidth > 0 && rowWidth + GAP + item.width > width - 40) {
			rows.push([]);
			rowWidth = 0;
		}
		rows[rows.length - 1].push(item);
		rowWidth += (rowWidth > 0 ? GAP : 0) + item.width;
	}

	rows.forEach((row, rowIndex) => {
		const total = row.reduce((sum, item) => sum + item.width, 0) + GAP * (row.length - 1);
		let x = (width - total) / 2;
		const y = 50 + rowIndex * ROW_HEIGHT;

		for (const item of row) {
			ctx.fillStyle = fill(item.index);
			ctx.strokeStyle = stroke(item.index);
			ctx.lineWidth = 2;
			ctx.fillRect(x, y - BOX_HEIGHT / 2, BOX_WIDTH, BOX_HEIGHT);
			ctx.strokeRect(x, y - BOX_HEIGHT / 2, BOX_WIDTH, BOX_HEIGHT);

			ctx.fillStyle = theme.text;
			ctx.textAlign = "left";
			ctx.fillText(item.text, x + BOX_WIDTH + 8, y);
			x += item.width + GAP;
		}
	});

	return 50 + (rows.length - 1) * ROW_HEIGHT + 16;
}

function drawCartesian(ctx, { type, labels, values, font, theme, width, height, top }) {
	ctx.font = font(12);
	const scale = niceScale(Math.max(0, ...values), Math.min(10, Math.max(2, Math.floor((height - top - 80) / 50))));
	const tickLabels = scale.ticks.map(formatValue);
	const left = 22 + Math.max(...tickLabels.map((label) => ctx.measureText(label).width));
	const right = width - 14;
	const slot = (right - left) / Math.max(1, labels.length);

	const texts = labels.map((label) => fitText(ctx, label, 180));
	const widest = Math.max(0, ...texts.map((text) => ctx.measureText(text).width));
	const angle = [0, 15, 30, 45].find((degrees) => widest * Math.cos((degrees * Math.PI) / 180) <= slot - 6) ?? 45;
	const radians = (angle * Math.PI) / 180;
	const bottom = height - 14 - (angle ? widest * Math.sin(radians) + 6 : 10);
	const yOf = (value) => bottom - (value / scale.max) * (bottom - top);

	ctx.lineWidth = 1;
	ctx.strokeStyle = theme.grid;
	ctx.fillStyle = theme.text;
	ctx.textAlign = "right";
	ctx.textBaseline = "middle";
	scale.ticks.forEach((tick) => {
		ctx.beginPath();
		ctx.moveTo(left, Math.round(yOf(tick)) + 0.5);
		ctx.lineTo(right, Math.round(yOf(tick)) + 0.5);
		ctx.stroke();
		ctx.fillText(formatValue(tick), left - 8, yOf(tick));
	});

	const centerOf = (i) => left + slot * (i + 0.5);
	for (let i = 0; i <= labels.length; i += 1) {
		const x = Math.round(type === "bar" ? left + slot * i : centerOf(Math.min(i, labels.length - 1))) + 0.5;
		if (type === "line" && i === labels.length) break;
		ctx.beginPath();
		ctx.moveTo(x, top);
		ctx.lineTo(x, bottom);
		ctx.stroke();
	}

	const every = Math.max(1, Math.ceil(18 / slot));
	ctx.fillStyle = theme.text;
	texts.forEach((full, i) => {
		if (i % every) return;
		const text = angle ? fitText(ctx, full, (width - 6 - centerOf(i)) / Math.cos(radians)) : full;
		ctx.save();
		ctx.translate(centerOf(i), bottom + 10);
		ctx.rotate(radians);
		ctx.textAlign = angle ? "left" : "center";
		ctx.textBaseline = "top";
		ctx.fillText(text, angle ? -4 : 0, 0);
		ctx.restore();
	});

	if (type === "bar") {
		values.forEach((value, i) => {
			const x = left + slot * (i + 0.14);
			const barWidth = slot * 0.72;
			const y = yOf(value);
			ctx.fillStyle = fill(i);
			ctx.fillRect(x, y, barWidth, bottom - y);
			ctx.strokeStyle = stroke(i);
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(x, bottom);
			ctx.lineTo(x, y);
			ctx.lineTo(x + barWidth, y);
			ctx.lineTo(x + barWidth, bottom);
			ctx.stroke();
		});
		return;
	}

	ctx.strokeStyle = stroke(0);
	ctx.lineWidth = 2;
	ctx.lineJoin = "round";
	ctx.beginPath();
	values.forEach((value, i) => (i ? ctx.lineTo(centerOf(i), yOf(value)) : ctx.moveTo(centerOf(i), yOf(value))));
	ctx.stroke();

	values.forEach((value, i) => {
		ctx.beginPath();
		ctx.arc(centerOf(i), yOf(value), 3, 0, Math.PI * 2);
		ctx.fillStyle = fill(i);
		ctx.fill();
		ctx.strokeStyle = stroke(i);
		ctx.stroke();
	});
}

function drawSlices(ctx, { type, values, cx, cy, radius }) {
	const total = values.reduce((sum, value) => sum + value, 0);
	if (total <= 0) return;

	let start = -Math.PI / 2;
	values.forEach((value, i) => {
		const end = start + (value / total) * Math.PI * 2;
		ctx.beginPath();
		if (type === "doughnut") {
			ctx.arc(cx, cy, radius, start, end);
			ctx.arc(cx, cy, radius / 2, end, start, true);
		} else {
			ctx.moveTo(cx, cy);
			ctx.arc(cx, cy, radius, start, end);
		}
		ctx.closePath();
		ctx.fillStyle = fill(i);
		ctx.fill();
		ctx.strokeStyle = stroke(i);
		ctx.lineWidth = 2;
		ctx.lineJoin = "round";
		ctx.stroke();
		start = end;
	});
}

function drawPolarArea(ctx, { values, font, theme, background, cx, cy, radius }) {
	const scale = niceScale(Math.max(0, ...values), 7);
	const sweep = (Math.PI * 2) / values.length;

	ctx.lineWidth = 1;
	ctx.strokeStyle = theme.grid;
	for (const tick of scale.ticks.slice(1)) {
		ctx.beginPath();
		ctx.arc(cx, cy, (tick / scale.max) * radius, 0, Math.PI * 2);
		ctx.stroke();
	}

	values.forEach((value, i) => {
		const start = -Math.PI / 2 + i * sweep;
		ctx.beginPath();
		ctx.moveTo(cx, cy);
		ctx.arc(cx, cy, (value / scale.max) * radius, start, start + sweep);
		ctx.closePath();
		ctx.fillStyle = fill(i);
		ctx.fill();
		ctx.strokeStyle = stroke(i);
		ctx.lineWidth = 2;
		ctx.lineJoin = "round";
		ctx.stroke();
	});

	ctx.font = font(12);
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	for (const tick of scale.ticks.slice(1)) {
		drawOutlinedText(ctx, theme, background, formatValue(tick), cx, cy - (tick / scale.max) * radius);
	}
}

function drawRadar(ctx, { labels, values, font, theme, background, cx, cy, radius }) {
	const scale = niceScale(Math.max(0, ...values), 7);
	const angleOf = (i) => -Math.PI / 2 + (i * Math.PI * 2) / labels.length;
	const point = (i, distance) => [cx + Math.cos(angleOf(i)) * distance, cy + Math.sin(angleOf(i)) * distance];
	const polygon = (distances) => {
		ctx.beginPath();
		distances.forEach((distance, i) => ctx.lineTo(...point(i, distance)));
		ctx.closePath();
	};

	ctx.lineWidth = 1;
	ctx.strokeStyle = theme.grid;
	for (const tick of scale.ticks.slice(1)) {
		polygon(labels.map(() => (tick / scale.max) * radius));
		ctx.stroke();
	}
	labels.forEach((_, i) => {
		ctx.beginPath();
		ctx.moveTo(cx, cy);
		ctx.lineTo(...point(i, radius));
		ctx.stroke();
	});

	polygon(values.map((value) => (value / scale.max) * radius));
	ctx.fillStyle = fill(0);
	ctx.fill();
	ctx.strokeStyle = stroke(0);
	ctx.lineWidth = 2;
	ctx.lineJoin = "round";
	ctx.stroke();

	values.forEach((value, i) => {
		ctx.beginPath();
		ctx.arc(...point(i, (value / scale.max) * radius), 3, 0, Math.PI * 2);
		ctx.fillStyle = fill(i);
		ctx.fill();
		ctx.strokeStyle = stroke(i);
		ctx.stroke();
	});

	ctx.font = font(12);
	ctx.textBaseline = "middle";
	labels.forEach((label, i) => {
		const sin = Math.sin(angleOf(i) + Math.PI / 2);
		const [x, y] = point(i, radius + 12);
		ctx.textAlign = sin > 0.3 ? "left" : sin < -0.3 ? "right" : "center";
		ctx.textBaseline =
			Math.cos(angleOf(i) + Math.PI / 2) > 0.3
				? "bottom"
				: Math.cos(angleOf(i) + Math.PI / 2) < -0.3
					? "top"
					: "middle";
		ctx.fillStyle = theme.text;
		ctx.fillText(fitText(ctx, label, 150), x, y);
	});

	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	for (const tick of scale.ticks.slice(1)) {
		drawOutlinedText(ctx, theme, background, formatValue(tick), cx, cy - (tick / scale.max) * radius);
	}
}

const RADIAL = new Map([
	["pie", drawSlices],
	["doughnut", drawSlices],
	["polarArea", drawPolarArea],
	["radar", drawRadar]
]);
const CARTESIAN = ["bar", "line"];
const LEGEND_PER_LABEL = ["pie", "doughnut", "polarArea"];

/** Draws the chart as a PNG. */
function renderChart({ type, labels, values, background }) {
	const drawRadial = RADIAL.get(type);
	const radial = drawRadial !== undefined;
	if (!radial && !CARTESIAN.includes(type)) throw new Error(`[XP] Unknown chart type: ${type}`);

	const Canvas = require("@napi-rs/canvas");
	const font = useFont(Canvas);
	const height = radial ? RADIAL_HEIGHT : CARTESIAN_HEIGHT;
	const canvas = Canvas.createCanvas(WIDTH, height);
	const ctx = canvas.getContext("2d");

	const paper = background || DEFAULT_BACKGROUND;
	ctx.fillStyle = DEFAULT_BACKGROUND;
	ctx.fillStyle = paper;
	ctx.fillRect(0, 0, WIDTH, height);
	const theme = themeFor(ctx, paper);

	const legend = LEGEND_PER_LABEL.includes(type)
		? labels.map((label, index) => ({ label, index }))
		: [{ label: DATASET_LABEL, index: 0 }];
	const top = drawHeader(ctx, font, theme, WIDTH, legend) + 6;

	if (!radial) {
		drawCartesian(ctx, { type, labels, values, font, theme, width: WIDTH, height, top });
		return canvas.toBuffer("image/png");
	}

	const cx = WIDTH / 2;
	const cy = (top + height - 8) / 2;
	let radius = Math.min(WIDTH / 2 - 10, (height - 8 - top) / 2 - 4);
	if (type === "radar") {
		ctx.font = font(12);
		labels.forEach((label, i) => {
			const sin = Math.abs(Math.sin((i * Math.PI * 2) / labels.length));
			if (sin > 0.3) {
				const room = WIDTH / 2 - 14 - Math.min(150, ctx.measureText(label).width);
				radius = Math.min(radius, room / sin - 12);
			}
		});
		radius = Math.min(radius, (height - 8 - top) / 2 - 26);
	}

	drawRadial(ctx, { type, labels, values, font, theme, background: paper, cx, cy, radius });
	return canvas.toBuffer("image/png");
}

module.exports = renderChart;
