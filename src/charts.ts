import {createCanvas, GlobalFonts} from "@napi-rs/canvas";
import {join} from "path";
import {leaderboard} from "./leaderboard";
import {RoundedBox} from "./cards";
import {XpFatal, XpLog} from "./functions/xplogs";

/**
 * Chart options
 * @property {string} font - Font of the chart
 * @property {"blue" | "dark" | "discord" | "green" | "orange" | "red" | "space" | "yellow"} theme - Theme of the chart
 * @property {number} limit - Limit of users to return (2-10)
 */
export interface ChartOptions {
	font?: string;
	limit?: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
	theme?: "blue" | "dark" | "discord" | "green" | "orange" | "red" | "space" | "yellow";
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
	if (!guildId) throw new XpFatal({function: "charts()", message: "No Guild ID Provided"});
	if (!options) throw new XpFatal({function: "charts()", message: "No Options Provided"});
	if (!options.theme || !["blue", "dark", "discord", "green", "orange", "red", "space", "yellow"].includes(options.theme)) {
		XpLog.warn("charts()", "Invalid theme provided, defaulting to discord");
		options.theme = "discord";
	}
	if (!options.type || !["bar", "doughnut", "pie"].includes(options.type)) {
		XpLog.warn("charts()", "Invalid type provided, defaulting to bar chart");
		options.type = "bar";
	}
	let colors = {
		background: "#FFFFFF",
		barColor: "#FFFFFF",
		pieColors: ["#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF"],
		textColor: "#FFFFFF"
	};

	const users = await leaderboard(guildId, Math.min(Math.max(options?.limit || 10, 2), 10)).catch((XPError) => {
		throw new XpFatal({function: "charts()", message: XPError.message});
	});

	if (users.length < 2) throw new XpFatal({function: "charts()", message: "Not enough users to create a chart"});
	users.sort((a, b) => b.position - a.position);

	GlobalFonts.registerFromPath(options?.font || join(__dirname, "Fonts", "BalooBhaijaan-Regular.woff2"), "Sans Serif");

	switch (options.theme) {
	case "blue":
		colors = {
			background: "#1e1e3c",
			barColor: "#747fff",
			pieColors: ["#747fff", "#2832C2", "#59788E", "#00d2e7", "#281E5D", "#a9f5ff", "#000e3f", "#30edc2", "#186c84", "#0098ff"],
			textColor: "#FFFFFF"
		};
		break;

	case "dark":
		colors = {
			background: "#1e1e1e",
			barColor: "#747474",
			pieColors: ["#1B1D1F", "#454C53", "#72787F", "#999999", "#9EA4AA", "#CCCCCC", "#C9CDD2", "#DEDEDE", "#E8EBED", "#FFFFFF"],
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
			pieColors: ["#00FF00", "#008000", "#7FFF00", "#32CD32", "#228B22", "#006400", "#9ACD32", "#00FA9A", "#ADFF2F", "#7CFC00"],
			textColor: "#FFFFFF"
		};
		break;

	case "orange":
		colors = {
			background: "#321e1e",
			barColor: "#ff9f74",
			pieColors: ["#FF8C00", "#FF5E0E", "#FF4500", "#FF6347", "#E26310", "#F5761A", "#FD673A", "#FFA500", "#FF7F50", "#FFD700"],
			textColor: "#FFFFFF"
		};
		break;

	case "red":
		colors = {
			background: "#321e1e",
			barColor: "#ff7474",
			pieColors: ["#FF0000", "#FF2400", "#FF4500", "#FF6347", "#FF7F50", "#FF8C00", "#FFA07A", "#FFA500", "#FFC0CB", "#FFD700"],
			textColor: "#FFFFFF"
		};
		break;

	case "space":
		colors = {
			background: "#001F3F",
			barColor: "#192E5B",
			pieColors: ["#192E5B", "#1F3F7F", "#264FA3", "#2C5FC7", "#337FEA", "#3D8FFF", "#4D9FFF", "#5DAFFF", "#6DBFFF", "#7DCFFF"],
			textColor: "#FFFFFF"
		};
		break;

	case "yellow":
		colors = {
			background: "#32321e",
			barColor: "#ffff74",
			pieColors: ["#FFFD37", "#FFEF00", "#FDFF00", "#DAA520", "#F4C430", "#E4D00A", "#D2B55B", "#FFFFE0", "#FFFACD", "#F5DEB3"],
			textColor: "#FFFFFF"
		};
		break;
	}

	const canvas = createCanvas(920, 600),
		context = canvas.getContext("2d"),
		maxLevel = Math.max(...users.map((user) => user.level));

	RoundedBox(context, 0, 0, canvas.width, canvas.height, 25);
	context.clip();

	context.fillStyle = colors.background;
	context.fillRect(0, 0, canvas.width, canvas.height);

	if (options.theme === "space") {
		// Clear the canvas
		context.clearRect(0, 0, canvas.width, canvas.height);

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

	let chartAreaWidth = canvas.width - 20 * 2;
	let chartAreaHeight = canvas.height - 20 * 2;

	switch (options.type) {
	case "bar": {
		const maxValueLabelWidth = context.measureText(maxLevel.toString()).width;

		chartAreaWidth = canvas.width - maxValueLabelWidth - 20 * 3 - 20 * 2;
		chartAreaHeight = canvas.height - 100 - 20 * 2;

		const barWidth = chartAreaWidth / users.length - 20;

		const chartStartX = 20 + maxValueLabelWidth + 20 * 2;
		const chartStartY = canvas.height - 50 - 20;

		await Promise.all(
			users.map(async (user, index) => {
				const barHeight = (user.level / maxLevel) * chartAreaHeight;

				const barX = chartStartX + index * (barWidth + 20);
				const barY = chartStartY - barHeight;

				context.fillStyle = colors.barColor;
				context.strokeStyle = colors.barColor;
				context.lineWidth = 2;

				RoundedBox(context, barX, barY, barWidth, barHeight, 10);

				context.fill();
				context.stroke();

				const textX = barX + barWidth / 2; // Center x-coordinate for both username and level text


				context.fillStyle = colors.textColor;
				context.font = "22px Sans Serif";
				const levelText = user.level.toString();
				const levelTextWidth = context.measureText(levelText).width;
				const levelTextY = barY - 10;

				context.fillText(levelText, textX - levelTextWidth / 2, levelTextY);

				const usernameText = user?.name || user.user;
				let usernameTextWidth = context.measureText(usernameText).width;

				context.font = `${Math.min(Math.floor(16 * (barWidth / usernameTextWidth)), 18)}px Sans Serif`;
				usernameTextWidth = context.measureText(usernameText).width;

				const usernameTextY = chartStartY + 30;


				if (options.theme === "space") {
					const textPadding = 5;
					const textBackgroundWidth = usernameTextWidth + textPadding * 2;
					const textBackgroundX = textX - textBackgroundWidth / 2;
					const textBackgroundY = usernameTextY - 18; // Adjust the value as needed

					context.fillStyle = "rgba(0, 0, 0, 0.5)"; // Translucent black background
					context.fillRect(textBackgroundX, textBackgroundY, textBackgroundWidth, 22);
				}

				context.fillStyle = colors.textColor;
				context.fillText(usernameText, textX - usernameTextWidth / 2, usernameTextY);
			})
		);

	}
		break;

	case "doughnut": {
		const totalLevelSum = users.reduce((sum, user) => sum + user.level, 0);
		const outerRadius = Math.min(chartAreaWidth, chartAreaHeight) / 3; // Adjust the divisor for a smaller outer radius
		const innerRadius = outerRadius * 0.6; // Adjust the multiplier for the size of the hole

		let startAngle = -Math.PI / 2;
		const centerX = canvas.width / 2, centerY = canvas.height / 2;

		await Promise.all(
			users.map(async (user, index) => {
				const slicePercentage = user.level / totalLevelSum;
				const endAngle = startAngle + 2 * Math.PI * slicePercentage;
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
		);
	}
		break;

	case "pie": {
		const totalLevelSum = users.reduce((sum, user) => sum + user.level, 0);
		const radius = Math.min(chartAreaWidth, chartAreaHeight) / 3; // Adjust the divisor for a smaller radius

		let startAngle = -Math.PI / 2;
		const centerX = canvas.width / 2, centerY = canvas.height / 2;

		await Promise.all(
			users.map(async (user, index) => {
				const slicePercentage = user.level / totalLevelSum;
				const endAngle = startAngle + 2 * Math.PI * slicePercentage;
				context.fillStyle = colors.pieColors[index % colors.pieColors.length] || "#FFFFFF";

				context.beginPath();
				context.moveTo(centerX, centerY);
				context.arc(centerX, centerY, radius, startAngle, endAngle);
				context.closePath();
				context.fill();

				startAngle = endAngle;
			})
		);
	}
		break;

	default:
		throw new XpFatal({function: "charts()", message: "Invalid chart type provided"});
	}

	if (["doughnut", "pie"].includes(options.type)) {	// Render legend
		const legendX = 20; // Legend position from left
		const legendY = canvas.height - 20 - users.length * 20; // Legend position from bottom
		const legendSpacing = 20; // Vertical spacing between legend items

		context.fillStyle = "rgba(0,0,0,0.25)";
		context.fillRect(legendX - 5, legendY - 5, 200, users.length * legendSpacing + 5);

		context.font = "12px Sans Serif";
		await Promise.all(users.map(async (user, index) => {
			const legendText = user?.name || user.user;
			const legendColor = colors.pieColors[index % colors.pieColors.length];
			const legendColorBoxX = legendX;
			const legendItemY = legendY + index * legendSpacing;

			// Place colored squares to the right and usernames to the left
			context.fillStyle = legendColor || "#FFFFFF";
			context.fillRect(legendColorBoxX, legendItemY, 15, 15);

			context.fillStyle = colors.textColor;
			context.fillText(legendText, legendColorBoxX + 20, legendItemY + 11.5);
		}));

	}

	return {
		attachment: canvas.toBuffer("image/png"),
		description: "Chart", name: "chart.png"
	};
}