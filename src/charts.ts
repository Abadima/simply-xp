import { clean, leaderboard, registerFont, xp } from "../xp";
import { XpFatal, XpLog } from "./functions/xplogs";
import { createCanvas } from "@napi-rs/canvas";
import { RoundedBox } from "./cards";
import { join } from "path";

/**
 * Chart options
 * @property {string} font - Font of the chart
 * @property {"blue" | "dark" | "discord" | "green" | "orange" | "red" | "space" | "yellow"} theme - Theme of the chart
 * @property {number} limit - Limit of users to return (2-10)
 */
export interface ChartOptions {
	fallbackFont?: string;
	font?: string;
	limit?: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
	theme?: "blue" | "dark" | "discord" | "green" | "light" | "orange" | "pink" | "red" | "space" | "yellow";
	type?: "bar" | "doughnut" | "pie";
}


/**
 * Creates a chart
 * @async
 * @param {string} guildId
 * @param {ChartOptions?} options
 * @link `Documentation:` https://simplyxp.js.org/docs/next/functions/charts
 * @returns {Promise<{attachment: Buffer, description: string, name: string}>} Chart attachment
 * @throws {XpFatal} If invalid parameters are provided, or if there are not enough users to create a chart
 */
export async function charts(guildId: string, options: ChartOptions = {}): Promise<{
	attachment: Buffer; description: string; name: string;
}> {
	if (!guildId) throw new XpFatal({ function: "charts()", message: "No Guild ID Provided" });
	if (!options) throw new XpFatal({ function: "charts()", message: "No Options Provided" });
	if (!options.theme || !["blue", "dark", "discord", "green", "light", "orange", "pink", "red", "space", "yellow"].includes(options.theme)) {
		XpLog.warn("charts()", "Invalid theme provided, defaulting to discord");
		options.theme = "discord";
	}
	if (!options.type || !["bar", "doughnut", "pie"].includes(options.type)) {
		XpLog.warn("charts()", "Invalid type provided, defaulting to bar chart");
		options.type = "bar";
	}
	let colors: {
		background: string;
		barColor: string;
		pieColors: string[];
		textColor: string;
	};

	const users = await leaderboard(guildId, Math.min(Math.max(options?.limit || 10, 2), 10)).catch((XPError) => {
		throw new XpFatal({ function: "charts()", message: XPError.message });
	});

	if (users.length < 2) throw new XpFatal({ function: "charts()", message: "Not enough users to create a chart" });

	await registerFont(options?.font || join(__dirname, "fonts", "Baloo2-Regular.woff2"), "Baloo");
	if (options.fallbackFont) await registerFont(options.fallbackFont, "FallbackFont");

	switch (options.theme) {
		case "blue":
			colors = {
				background: "#1e1e3c",
				barColor: "#747fff",
				pieColors: ["#5A6BFF", "#52FFF2", "#6FB6FF", "#30EDC2", "#3F8CFF", "#1BB8A3", "#8CD9FF", "#2F53FF", "#0098FF", "#A9F5FF"],
				textColor: "#FFFFFF"
			};
			break;

		case "dark":
			colors = {
				background: "#1e1e1e",
				barColor: "#747474",
				pieColors: ["#FF7A7A", "#39FF9D", "#4C8BF5", "#FFE066", "#2BD9FF", "#FF5EDB", "#C47BFF", "#6ED0FF", "#FFA53A", "#FFCC66"],
				textColor: "#FFFFFF"
			};
			break;

		case "discord":
			colors = {
				background: "#36393f",
				barColor: "#5865F2",
				pieColors: ["#5865F2", "#57F287", "#FEE75C", "#EB459E", "#ED4245", "#FFFFFF", "#000000", "#FAA61A", "#C04DF9", "#00AAFF"],
				textColor: "#FFFFFF"
			};
			break;

		case "green":
			colors = {
				background: "#1e321e",
				barColor: "#74ff7f",
				pieColors: ["#66FFB2", "#4DFFDF", "#A8FF66", "#32FF9C", "#7CFFA3", "#3AD7C9", "#00D47A", "#59FFC2", "#1ED1A6", "#7AFFCE"],
				textColor: "#FFFFFF"
			};
			break;

		case "light":
			colors = {
				background: "#f2f2f2",
				barColor: "#1c1c1c",
				pieColors: ["#FF7A7A", "#6ED0FF", "#FFCC66", "#C47BFF", "#2BD9FF", "#FFA53A", "#FF5EDB", "#39FF9D", "#FFE066", "#4C8BF5"],
				textColor: "#000000"
			};
			break;

		case "orange":
			colors = {
				background: "#321e1e",
				barColor: "#ff9f74",
				pieColors: ["#FF8A4C", "#FF6E35", "#FFD28C", "#FF7A45", "#FFAA66", "#FFC999", "#FF9A5E", "#FFB76B", "#FF8F52", "#FFD28C"],
				textColor: "#FFFFFF"
			};
			break;

		case "pink":
			colors = {
				background: "#3c1e3c",
				barColor: "#ff74ff",
				pieColors: ["#FF8BFF", "#FF6BD1", "#A87CFF", "#FFB6FF", "#7DF7FF", "#8FA6FF", "#5FA8FF", "#CE5CFF", "#FF4FA3", "#DFA0FF"],
				textColor: "#FFFFFF"
			};
			break;

		case "red":
			colors = {
				background: "#321e1e",
				barColor: "#ff7474",
				pieColors: ["#FF6B6B", "#FFD166", "#FF4F5C", "#FFB266", "#FF7A85", "#FFC099", "#FF6F91", "#FF8F4D", "#FF9A7A", "#FFA8B0"],
				textColor: "#FFFFFF"
			};
			break;

		case "space":
			colors = {
				background: "#001F3F",
				barColor: "#192E5B",
				pieColors: ["#192E5B", "#264FA3", "#337FEA", "#2C5FC7", "#1F3F7F", "#3D8FFF", "#4D9FFF", "#5DAFFF", "#6DBFFF", "#7DCFFF"],
				textColor: "#FFFFFF"
			};
			break;

		case "yellow":
			colors = {
				background: "#32321e",
				barColor: "#ffff74",
				pieColors: ["#FFEF99", "#FFE266", "#FFB84D", "#FFF6C2", "#FFD966", "#e6ff77ff", "#FFCC33", "#E6A82E", "#D4A741", "#FFE8AA"],
				textColor: "#FFFFFF"
			};
			break;

	}

	const canvas = createCanvas(920, 600),
		context = canvas.getContext("2d"),
		maxLevel = Math.max(...users.map((user) => user.level));

	RoundedBox(context, 0, 0, canvas.width, canvas.height, 25, { clip: true });

	context.fillStyle = colors.background;
	context.fillRect(0, 0, canvas.width, canvas.height);

	if (options.theme === "space") {

		// Create a background gradient to represent the vastness of space
		const spaceGradient = context.createRadialGradient(
			canvas.width / 2, canvas.height / 2, 1,
			canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
		);
		spaceGradient.addColorStop(0, "#000000");  // Dark black at the center
		spaceGradient.addColorStop(1, "#001F3F");  // Dark blue at the outer edge
		context.fillStyle = spaceGradient;
		context.fillRect(0, 0, canvas.width, canvas.height);

		// Add a realistic moon to the top left
		const moonRadius = 100;
		const moonGradient = context.createRadialGradient(
			150, 150, 10,
			150, 150, moonRadius
		);
		moonGradient.addColorStop(0, "#F2F2F2"); // Light gray color for the moon
		moonGradient.addColorStop(0.8, "#D3D3D3"); // Slightly darker gray towards the edge
		moonGradient.addColorStop(1, "#001F3F"); // Dark blue color for the shadow
		context.fillStyle = moonGradient;

		context.beginPath();
		context.arc(150, 150, moonRadius, 0, 2 * Math.PI);
		context.fill();

		// Add distant planets with realistic colors
		const planetColors = ["#6B6B6B", "#AA8F00", "#473E83", "#456579"];
		for (let i = 0; i < planetColors.length; i++) {
			const planetX = Math.random() * canvas.width;
			const planetY = Math.random() * canvas.height;
			const planetRadius = Math.random() * 50 + 30; // Varying sizes
			context.beginPath();
			context.arc(planetX, planetY, planetRadius, 0, 2 * Math.PI);
			context.fillStyle = planetColors[i] || "#FFFFFF";
			context.fill();
		}

		context.filter = "blur(5px)";
		context.drawImage(canvas, 0, 0);
		context.filter = "none";

		// Add distant stars
		for (let i = 0; i < 100; i++) {
			const x = Math.random() * canvas.width;
			const y = Math.random() * canvas.height;
			const radius = Math.random() * 2;  // Smaller stars for depth
			context.beginPath();
			context.arc(x, y, radius, 0, 2 * Math.PI);
			context.fillStyle = "#FFFFFF";
			context.fill();
		}
	}

	let chartAreaWidth = canvas.width - 40;
	let chartAreaHeight = canvas.height - 40;

	switch (options.type) {
		case "bar": {
			const maxValueLabelWidth = context.measureText(maxLevel.toString()).width;

			chartAreaWidth = canvas.width - maxValueLabelWidth - 100;
			chartAreaHeight = canvas.height - 140;

			const barWidth = chartAreaWidth / users.length - 20;

			const chartStartX = maxValueLabelWidth + 60;
			const chartStartY = canvas.height - 70;

			users.map((user, index) => {
				const barHeight = (user.level === Infinity ? 1 : user.level / maxLevel) * chartAreaHeight;

				const barX = chartStartX + index * (barWidth + 20);
				const barY = chartStartY - barHeight;

				context.save();
				RoundedBox(context, barX, barY, barWidth, barHeight, 10, {
					clip: true, fill: { color: colors.barColor }
				});
				context.restore();

				const textX = barX + barWidth / 2; // Center x-coordinate for both username and level text

				context.fillStyle = colors.textColor;
				context.font = "22px Baloo, FallbackFont";
				const levelText = user.level.toString();
				const levelTextWidth = context.measureText(levelText).width;
				const levelTextY = barY - 10;

				context.fillText(levelText, textX - levelTextWidth / 2, levelTextY);

				const usernameText = user?.name || user.user;
				let usernameTextWidth = context.measureText(usernameText).width;

				context.font = `${Math.min(Math.floor(16 * (barWidth / usernameTextWidth)), 18)}px Baloo, FallbackFont`;
				usernameTextWidth = context.measureText(usernameText).width;

				const usernameTextY = chartStartY + 30;


				if (options.theme === "space") {
					const textBackgroundWidth = usernameTextWidth + 20;
					const textBackgroundX = textX - textBackgroundWidth / 2;

					context.fillStyle = "rgba(0, 0, 0, 0.5)"; // Translucent black background
					context.fillRect(textBackgroundX, usernameTextY - 18, textBackgroundWidth, 25);
				}

				context.fillStyle = colors.textColor;
				context.fillText(usernameText, textX - usernameTextWidth / 2, usernameTextY);
			})
		}
			break;

		case "doughnut": {
			const totalLevelSum = users.reduce((sum, user) => sum + user.level, 0);
			const outerRadius = Math.min(chartAreaWidth, chartAreaHeight) / 3; // Adjust the divisor for a smaller outer radius
			const innerRadius = outerRadius * 0.6; // Adjust the multiplier for the size of the hole

			let startAngle = -Math.PI / 2;
			const centerX = canvas.width / 2, centerY = canvas.height / 2;

			users.map((user, index) => {
				const endAngle = startAngle + 2 * Math.PI * (user.level / totalLevelSum);
				context.fillStyle = colors.pieColors[index % colors.pieColors.length] || "#FFFFFF";

				context.beginPath();
				context.moveTo(centerX + outerRadius * Math.cos(startAngle), centerY + outerRadius * Math.sin(startAngle));
				context.arc(centerX, centerY, outerRadius, startAngle, endAngle);
				context.lineTo(centerX + innerRadius * Math.cos(endAngle), centerY + innerRadius * Math.sin(endAngle));
				context.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
				context.closePath();
				context.fill();

				startAngle = endAngle;
			})
		}
			break;

		case "pie": {
			const totalLevelSum = users.reduce((sum, user) => sum + user.level, 0);
			const radius = Math.min(chartAreaWidth, chartAreaHeight) / 3; // Adjust the divisor for a smaller radius

			let startAngle = -Math.PI / 2;
			const centerX = canvas.width / 2, centerY = canvas.height / 2;

			users.map((user, index) => {
				const endAngle = startAngle + 2 * Math.PI * (user.level / totalLevelSum);
				context.fillStyle = colors.pieColors[index % colors.pieColors.length] || "#FFFFFF";

				context.beginPath();
				context.moveTo(centerX, centerY);
				context.arc(centerX, centerY, radius, startAngle, endAngle);
				context.closePath();
				context.fill();

				startAngle = endAngle;
			})
		}
			break;

		default:
			throw new XpFatal({ function: "charts()", message: "Invalid chart type provided" });
	}

	if (["doughnut", "pie"].includes(options.type)) {	// Render legend
		const legendX = 20; // Legend position from left
		const legendY = canvas.height - 20 - users.length * 20; // Legend position from bottom
		const legendSpacing = 20; // Vertical spacing between legend items

		context.fillStyle = "rgba(0,0,0,0.25)";
		context.fillRect(legendX - 5, legendY - 5, 200, users.length * legendSpacing + 5);

		context.font = "12px Baloo, FallbackFont";

		users.map((user, index) => {
			const legendColor = colors.pieColors[index % colors.pieColors.length];
			const legendItemY = legendY + index * legendSpacing;

			// Place colored squares to the right and usernames to the left
			context.fillStyle = legendColor || "#FFFFFF";
			context.fillRect(legendX, legendItemY, 15, 15);

			context.fillStyle = colors.textColor;
			context.fillText(user?.name || user.user, legendX + 20, legendItemY + 11.5);
		});
	}

	if (xp.auto_clean) clean();

	return {
		attachment: canvas.toBuffer("image/webp"),
		description: `${options.type!.charAt(0).toUpperCase() + options.type!.slice(1)} chart — Top ${users.length} users (${options.theme} theme)`.slice(0, 200),
		name: "chart.webp"
	};
}