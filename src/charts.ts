import { renderCleanup } from "./functions/renderCleanup";
import { XpFatal, XpLog } from "./functions/xplogs";
import { registerCardFonts } from "./functions/utilities";
import { requireGuildId, requireValue } from "./functions/guards";
import { CARD_FONT, RoundedBox } from "./functions/draw";
import { encodeWebp, loadCanvas } from "./functions/canvas";
import { leaderboard } from "./leaderboard";

/**
 * Chart options
 * @property {string} font - ABSOLUTE FILE PATH of the font
 * @property {string} fallbackFont - ABSOLUTE FILE PATH of a font for characters `font` lacks
 * @property {"blue" | "dark" | "discord" | "green" | "light" | "orange" | "pink" | "red" | "space" | "yellow"} theme - Theme of the chart
 * @property {"bar" | "doughnut" | "pie"} type - Kind of chart (default: bar)
 * @property {number} limit - Limit of users to return (2-10)
 */
export interface ChartOptions {
	fallbackFont?: string;
	font?: string;
	limit?: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
	theme?: "blue" | "dark" | "discord" | "green" | "light" | "orange" | "pink" | "red" | "space" | "yellow";
	type?: "bar" | "doughnut" | "pie";
}

type ChartTheme = NonNullable<ChartOptions["theme"]>;
type ChartType = NonNullable<ChartOptions["type"]>;

type ChartThemeColors = {
	background: string;
	barColor: string;
	pieColors: string[];
	textColor: string;
};

const CHART_THEME_COLORS: Record<ChartTheme, ChartThemeColors> = {
	blue: {
		background: "#1e1e3c",
		barColor: "#747fff",
		pieColors: ["#5A6BFF", "#52FFF2", "#6FB6FF", "#30EDC2", "#3F8CFF", "#1BB8A3", "#8CD9FF", "#2F53FF", "#0098FF", "#A9F5FF"],
		textColor: "#FFFFFF"
	},
	dark: {
		background: "#1e1e1e",
		barColor: "#747474",
		pieColors: ["#FF7A7A", "#39FF9D", "#4C8BF5", "#FFE066", "#2BD9FF", "#FF5EDB", "#C47BFF", "#6ED0FF", "#FFA53A", "#FFCC66"],
		textColor: "#FFFFFF"
	},
	discord: {
		background: "#36393f",
		barColor: "#5865F2",
		pieColors: ["#5865F2", "#57F287", "#FEE75C", "#EB459E", "#ED4245", "#FFFFFF", "#000000", "#FAA61A", "#C04DF9", "#00AAFF"],
		textColor: "#FFFFFF"
	},
	green: {
		background: "#1e321e",
		barColor: "#74ff7f",
		pieColors: ["#66FFB2", "#4DFFDF", "#A8FF66", "#32FF9C", "#7CFFA3", "#3AD7C9", "#00D47A", "#59FFC2", "#1ED1A6", "#7AFFCE"],
		textColor: "#FFFFFF"
	},
	light: {
		background: "#f2f2f2",
		barColor: "#1c1c1c",
		pieColors: ["#FF7A7A", "#6ED0FF", "#FFCC66", "#C47BFF", "#2BD9FF", "#FFA53A", "#FF5EDB", "#39FF9D", "#FFE066", "#4C8BF5"],
		textColor: "#000000"
	},
	orange: {
		background: "#321e1e",
		barColor: "#ff9f74",
		pieColors: ["#FF8A4C", "#FF6E35", "#FFD28C", "#FF7A45", "#FFAA66", "#FFC999", "#FF9A5E", "#FFB76B", "#FF8F52", "#FFD28C"],
		textColor: "#FFFFFF"
	},
	pink: {
		background: "#3c1e3c",
		barColor: "#ff74ff",
		pieColors: ["#FF8BFF", "#FF6BD1", "#A87CFF", "#FFB6FF", "#7DF7FF", "#8FA6FF", "#5FA8FF", "#CE5CFF", "#FF4FA3", "#DFA0FF"],
		textColor: "#FFFFFF"
	},
	red: {
		background: "#321e1e",
		barColor: "#ff7474",
		pieColors: ["#FF6B6B", "#FFD166", "#FF4F5C", "#FFB266", "#FF7A85", "#FFC099", "#FF6F91", "#FF8F4D", "#FF9A7A", "#FFA8B0"],
		textColor: "#FFFFFF"
	},
	space: {
		background: "#001F3F",
		barColor: "#192E5B",
		pieColors: ["#192E5B", "#264FA3", "#337FEA", "#2C5FC7", "#1F3F7F", "#3D8FFF", "#4D9FFF", "#5DAFFF", "#6DBFFF", "#7DCFFF"],
		textColor: "#FFFFFF"
	},
	yellow: {
		background: "#32321e",
		barColor: "#ffff74",
		pieColors: ["#FFEF99", "#FFE266", "#FFB84D", "#FFF6C2", "#FFD966", "#e6ff77ff", "#FFCC33", "#E6A82E", "#D4A741", "#FFE8AA"],
		textColor: "#FFFFFF"
	},
};


const CHART_TYPES: ChartType[] = ["bar", "doughnut", "pie"];

/** The theme named by `value` and its colors; warns and falls back to discord for anything that is not a theme. */
function pickTheme(value: unknown): { colors: ChartThemeColors; theme: ChartTheme } {
	for (const [theme, colors] of Object.entries(CHART_THEME_COLORS) as [ChartTheme, ChartThemeColors][]) {
		if (theme === value) return { colors, theme };
	}
	XpLog.warn("charts()", "Invalid theme provided, defaulting to discord");
	return { colors: CHART_THEME_COLORS.discord, theme: "discord" };
}

/** `value` when it is one of `allowed`; otherwise warns and falls back. */
function pickOption<T extends string>(value: unknown, allowed: readonly string[], fallback: T, warning: string): T {
	if (typeof value === "string" && allowed.includes(value)) return value as T;
	XpLog.warn("charts()", warning);
	return fallback;
}

/**
 * Creates a chart
 * @async
 * @param {string} guildId
 * @param {ChartOptions?} options
 * @link `Documentation:` https://simplyxp.js.org/docs/functions/charts
 * @returns {Promise<{attachment: Buffer, description: string, name: string}>} Chart attachment
 * @throws {XpFatal} If invalid parameters are provided, or if there are not enough users to create a chart
 */
export async function charts(guildId: string, options: ChartOptions = {}): Promise<{
	attachment: Buffer; description: string; name: string;
}> {
	requireValue("charts()", guildId, "No Guild ID Provided");
	requireGuildId("charts()", guildId);
	requireValue("charts()", options, "No Options Provided");

	const { colors, theme } = pickTheme(options.theme);
	const type = pickOption<ChartType>(options.type, CHART_TYPES, "bar", "Invalid type provided, defaulting to bar chart");

	try {
		const pieColor = (index: number): string => colors.pieColors[index % colors.pieColors.length] || "#FFFFFF";

		const users = await leaderboard(guildId, Math.min(Math.max(options.limit || 10, 2), 10)).catch((XPError) => {
			throw new XpFatal({ function: "charts()", message: XPError.message });
		});

		if (users.length < 2) throw new XpFatal({ function: "charts()", message: "Not enough users to create a chart" });

		await registerCardFonts(options.font, options.fallbackFont);

		const { createCanvas } = await loadCanvas();
		const canvas = createCanvas(920, 600),
			context = canvas.getContext("2d"),
			maxLevel = Math.max(...users.map((user) => user.level));

		const safeMaxLevel = maxLevel > 0 ? maxLevel : 1;

		RoundedBox(context, 0, 0, canvas.width, canvas.height, 25, { clip: true });

		context.fillStyle = colors.background;
		context.fillRect(0, 0, canvas.width, canvas.height);

		if (theme === "space") {

			const spaceGradient = context.createRadialGradient(
				canvas.width / 2, canvas.height / 2, 1,
				canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
			);
			spaceGradient.addColorStop(0, "#000000");
			spaceGradient.addColorStop(1, "#001F3F");
			context.fillStyle = spaceGradient;
			context.fillRect(0, 0, canvas.width, canvas.height);

			const moonRadius = 100;
			const moonGradient = context.createRadialGradient(
				150, 150, 10,
				150, 150, moonRadius
			);
			moonGradient.addColorStop(0, "#F2F2F2");
			moonGradient.addColorStop(0.8, "#D3D3D3");
			moonGradient.addColorStop(1, "#001F3F");
			context.fillStyle = moonGradient;

			context.beginPath();
			context.arc(150, 150, moonRadius, 0, 2 * Math.PI);
			context.fill();

			const planetColors = ["#6B6B6B", "#AA8F00", "#473E83", "#456579"];
			for (const planetColor of planetColors) {
				const planetX = Math.random() * canvas.width;
				const planetY = Math.random() * canvas.height;
				const planetRadius = Math.random() * 50 + 30;
				context.beginPath();
				context.arc(planetX, planetY, planetRadius, 0, 2 * Math.PI);
				context.fillStyle = planetColor;
				context.fill();
			}

			context.filter = "blur(5px)";
			context.drawImage(canvas, 0, 0);
			context.filter = "none";

			for (let i = 0; i < 100; i++) {
				const x = Math.random() * canvas.width;
				const y = Math.random() * canvas.height;
				const radius = Math.random() * 2;
				context.beginPath();
				context.arc(x, y, radius, 0, 2 * Math.PI);
				context.fillStyle = "#FFFFFF";
				context.fill();
			}
		}

		let chartAreaWidth = canvas.width - 40;
		let chartAreaHeight = canvas.height - 40;

		switch (type) {
			case "bar": {
				const maxValueLabelWidth = context.measureText(maxLevel.toString()).width;

				chartAreaWidth = canvas.width - maxValueLabelWidth - 100;
				chartAreaHeight = canvas.height - 140;

				const barWidth = chartAreaWidth / users.length - 20;

				const chartStartX = maxValueLabelWidth + 60;
				const chartStartY = canvas.height - 70;

				for (const [index, user] of users.entries()) {
					const normalizedLevel = Math.max(0, user.level);
					const barHeight = (normalizedLevel / safeMaxLevel) * chartAreaHeight;

					const barX = chartStartX + index * (barWidth + 20);
					const barY = chartStartY - barHeight;

					context.save();
					RoundedBox(context, barX, barY, barWidth, barHeight, 10, {
						clip: true, fill: { color: colors.barColor }
					});
					context.restore();

					const textX = barX + barWidth / 2;

					context.fillStyle = colors.textColor;
					context.font = `22px ${CARD_FONT}`;
					const levelText = user.level.toString();
					const levelTextWidth = context.measureText(levelText).width;
					const levelTextY = barY - 10;

					context.fillText(levelText, textX - levelTextWidth / 2, levelTextY);

					const usernameText = user.name || user.user;
					let usernameTextWidth = context.measureText(usernameText).width;

					context.font = `${Math.min(Math.floor(16 * (barWidth / usernameTextWidth)), 18)}px ${CARD_FONT}`;
					usernameTextWidth = context.measureText(usernameText).width;

					const usernameTextY = chartStartY + 30;


					if (theme === "space") {
						const textBackgroundWidth = usernameTextWidth + 20;
						const textBackgroundX = textX - textBackgroundWidth / 2;

						context.fillStyle = "rgba(0, 0, 0, 0.5)";
						context.fillRect(textBackgroundX, usernameTextY - 18, textBackgroundWidth, 25);
					}

					context.fillStyle = colors.textColor;
					context.fillText(usernameText, textX - usernameTextWidth / 2, usernameTextY);
				}
			}
				break;

			case "doughnut":
			case "pie": {
				const totalLevelSum = users.reduce((sum, user) => sum + Math.max(0, user.level), 0);
				const safeTotalLevelSum = totalLevelSum > 0 ? totalLevelSum : users.length;
				const outerRadius = Math.min(chartAreaWidth, chartAreaHeight) / 3;
				const innerRadius = type === "doughnut" ? outerRadius * 0.6 : 0;

				let startAngle = -Math.PI / 2;
				const centerX = canvas.width / 2, centerY = canvas.height / 2;

				for (const [index, user] of users.entries()) {
					const share = totalLevelSum > 0 ? Math.max(0, user.level) / safeTotalLevelSum : 1 / users.length;
					const endAngle = startAngle + 2 * Math.PI * share;
					context.fillStyle = pieColor(index);

					context.beginPath();
					if (innerRadius > 0) {
						context.moveTo(centerX + outerRadius * Math.cos(startAngle), centerY + outerRadius * Math.sin(startAngle));
						context.arc(centerX, centerY, outerRadius, startAngle, endAngle);
						context.lineTo(centerX + innerRadius * Math.cos(endAngle), centerY + innerRadius * Math.sin(endAngle));
						context.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
					} else {
						context.moveTo(centerX, centerY);
						context.arc(centerX, centerY, outerRadius, startAngle, endAngle);
					}
					context.closePath();
					context.fill();

					startAngle = endAngle;
				}
			}
				break;
		}

		if (type !== "bar") {
			const legendX = 20;
			const legendY = canvas.height - 20 - users.length * 20;
			const legendSpacing = 20;

			context.fillStyle = "rgba(0,0,0,0.25)";
			context.fillRect(legendX - 5, legendY - 5, 200, users.length * legendSpacing + 5);

			context.font = `12px ${CARD_FONT}`;

			for (const [index, user] of users.entries()) {
				const legendItemY = legendY + index * legendSpacing;

				context.fillStyle = pieColor(index);
				context.fillRect(legendX, legendItemY, 15, 15);

				context.fillStyle = colors.textColor;
				context.fillText(user.name || user.user, legendX + 20, legendItemY + 11.5);
			}
		}

		return {
			attachment: await encodeWebp(canvas),
			description: `${type.charAt(0).toUpperCase() + type.slice(1)} chart — Top ${users.length} users (${theme} theme)`.slice(0, 200),
			name: "chart.webp"
		};
	} finally {
		renderCleanup("charts()", "chart rendering");
	}
}