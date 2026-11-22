const leaderboard = require("./leaderboard");
const renderChart = require("./chartCard");

/**
 * @param {import("discord.js").Message} message
 * @param {import("../index").chartsOptions} options
 */
async function charts(message, options = {}) {
	const board = await leaderboard(message.client, message.guild.id, options.position || 5);

	return {
		attachment: renderChart({
			type: options.type || "bar",
			labels: board.map((entry) => entry.tag),
			values: board.map((entry) => entry.xp),
			background: options.background
		}),
		name: "chart.png"
	};
}

module.exports = charts;
