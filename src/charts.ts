import {XpFatal} from "./functions/xplogs";
// import {leaderboard} from "./leaderboard";

type HexColor = `#${string}` | `0x${string}`;

export interface ChartOptions {
	backgroundColor?: HexColor;
	limit?: number;
	type?: "bar" | "line" | "pie" | "doughnut" | "radar" | "polarArea";
}


// TODO: Add support for charts
/**
 * Creates a chart
 * @async
 * @param {string} guildId
 * @param {ChartOptions?} options
 * @link `Documentation:` https://simplyxp.js.org/docs/charts
 * @returns {Promise<void>}
 * @throws {XpFatal} If invalid parameters are provided
 */
export async function charts(guildId: string, options: ChartOptions = {}): Promise<void> {
	if (!guildId) throw new XpFatal({function: "charts()", message: "No Guild ID Provided"});
	if (!options) throw new XpFatal({function: "charts()", message: "No Options Provided"});
	if (options.limit && options.limit > 10) options.limit = 10;
	if (!options.type) options.type = "bar";

	// const users = await leaderboard(guildId, options?.limit || 10);

	throw new XpFatal({function: "charts()", message: "[V2] Under Development | Should be here within 2-3 dev releases."});
}