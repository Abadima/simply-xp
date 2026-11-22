// Draws every card and chart and saves it to Tests/Images/, so you can open the files and look at them.
// No database needed:  node Tests/cards.test.cjs
const assert = require("assert");
const { mkdir, writeFile } = require("fs/promises");
const { join } = require("path");
const { runGroup, runCase, kilobytes, makeImages } = require("./helpers.cjs");
const renderRankCard = require("../src/rankCard");
const renderChart = require("../src/chartCard");

const OUTPUT = join(__dirname, "Images");
const { avatar, background } = makeImages();
const user = (tag) => ({ tag, displayAvatarURL: () => avatar });

const isWebP = (buffer) => buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP";
const pngSize = (buffer) =>
	buffer.subarray(1, 4).toString() === "PNG" ? `${buffer.readUInt32BE(16)}x${buffer.readUInt32BE(20)}` : null;

async function save(folder, name, buffer, extension) {
	await mkdir(join(OUTPUT, folder), { recursive: true });
	const file = join("Tests", "Images", folder, `${name}.${extension}`);
	await writeFile(join(__dirname, "..", file), buffer);
	return `${file} (${kilobytes(buffer)})`;
}

const RANK_CARDS = {
	default: { data: { level: 3, xp: 1234, reqxp: 1600, rank: 1, guildName: "Simply XP" }, style: {} },
	"custom-colors": {
		data: { level: 3, xp: 1234, reqxp: 1600, rank: 2, guildName: "Simply XP" },
		style: { color: "#ff3366", lvlbar: "#00ff00", lvlbarBg: "#222222" }
	},
	"new-user": { data: { level: 0, xp: 0, reqxp: 100, rank: 42, guildName: "Simply XP" }, style: {} },
	"bar-almost-full": { data: { level: 11, xp: 14300, reqxp: 14400, rank: 5, guildName: "Simply XP" }, style: {} },
	"big-numbers": { data: { level: 1110, xp: 1234567, reqxp: 1232100, rank: 3, guildName: "Simply XP" }, style: {} },
	"long-guild-name": {
		data: { level: 3, xp: 1234, reqxp: 1600, rank: 1, guildName: "A Guild With A Rather Long Name Here" },
		style: {}
	},
	"very-long-guild-name": {
		data: { level: 3, xp: 1234, reqxp: 1600, rank: 1, guildName: "x".repeat(70) },
		style: {}
	},
	"symbols-in-name": {
		data: { level: 3, xp: 1234, reqxp: 1600, rank: 1, guildName: "Simply XP", tag: "ユーザー😀 Name#0001" },
		style: {}
	}
};

const SAMPLE = {
	labels: ["Solstice#0001", "Abadima#0002", "Rahuletto#0003", "A very long username#0004", "Mee6#0005", "Amari#0006"],
	values: [12345, 9800, 4200, 1500, 800, 120]
};
const MANY = {
	labels: Array.from({ length: 25 }, (_, i) => `User number ${i}#${String(i).padStart(4, "0")}`),
	values: Array.from({ length: 25 }, (_, i) => Math.round(50000 / (i + 1)))
};
const CHART_TYPES = {
	bar: "950x526",
	line: "950x526",
	radar: "950x950",
	doughnut: "950x950",
	polarArea: "950x950",
	pie: "950x950"
};

async function run() {
	await runGroup("Rank card", async () => {
		for (const [name, { data, style }] of Object.entries(RANK_CARDS)) {
			await runCase(name, async () => {
				const card = await renderRankCard(
					{ ...data, user: user(data.tag || "Solstice#0001") },
					{ background, ...style }
				);

				assert.strictEqual(card.name, "rank.png");
				assert.strictEqual(card.description, "Rank Card");
				assert.ok(isWebP(card.attachment), "Expected the card to be a WebP image");
				return save("rankCard", name, card.attachment, "webp");
			});
		}
	});

	await runGroup("Charts", async () => {
		for (const [type, size] of Object.entries(CHART_TYPES)) {
			await runCase(type, async () => {
				const chart = renderChart({ type, ...SAMPLE });

				assert.strictEqual(pngSize(chart), size);
				return save("charts", type, chart, "png");
			});
		}

		await runCase("bar on a light background", async () => {
			const chart = renderChart({ type: "bar", ...SAMPLE, background: "#ffffff" });

			assert.strictEqual(pngSize(chart), "950x526");
			return save("charts", "bar-light", chart, "png");
		});

		await runCase("bar on a custom color", async () => {
			const chart = renderChart({ type: "bar", ...SAMPLE, background: "#1e3a5f" });

			assert.strictEqual(pngSize(chart), "950x526");
			return save("charts", "bar-blue", chart, "png");
		});

		await runCase("an invalid background falls back to the default", async () => {
			const chart = renderChart({ type: "bar", ...SAMPLE, background: "not a color" });

			assert.strictEqual(pngSize(chart), "950x526");
		});

		await runCase("25 users", async () => {
			const bars = renderChart({ type: "bar", ...MANY });
			const pie = renderChart({ type: "pie", ...MANY });

			assert.ok(pngSize(bars) && pngSize(pie));
			await save("charts", "bar-25-users", bars, "png");
			return save("charts", "pie-25-users", pie, "png");
		});

		await runCase("empty, single and all-zero boards still draw", async () => {
			const boards = {
				"empty-bar": { type: "bar", labels: [], values: [] },
				"single-radar": { type: "radar", labels: ["Solo#0001"], values: [42] },
				"zeros-polarArea": { type: "polarArea", labels: ["a#1", "b#2"], values: [0, 0] },
				"empty-pie": { type: "pie", labels: [], values: [] }
			};
			for (const [name, board] of Object.entries(boards)) {
				const chart = renderChart(board);
				assert.ok(pngSize(chart), `Expected ${name} to be a PNG`);
				await save("charts", name, chart, "png");
			}
		});

		await runCase("an unknown type is refused", async () => {
			assert.throws(() => renderChart({ type: "scatter", ...SAMPLE }), /Unknown chart type: scatter/);
			assert.throws(() => renderChart({ type: "constructor", ...SAMPLE }), /Unknown chart type: constructor/);
		});
	});

	console.log("\nImages are in Tests/Images/ — open them to check how the cards look.");
}

run().catch((error) => {
	console.error("[CARDS] Failure:", error);
	process.exit(1);
});
