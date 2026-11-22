import type { Document } from "mongodb";
import { XpFatal } from "./xplogs";
import { xp } from "../client";

/**
 * Convert XP to level and vice versa.
 *
 * @param {number} value.
 * @param {"xp" | "level"} type - Type to convert from (Default: level).
 * @link `Documentation:` https://simplyxp.js.org/docs/Functions/convert
 * @returns {number} - The converted value. (XP to level or level to XP)
 * @throws {XpFatal} If an invalid type is provided or if the value is not provided.
 */
export function convertFrom(value: number, type: ("xp" | "level") = "level"): number {
	if (isNaN(value)) throw new XpFatal({ function: "convertFrom()", message: "Value was not provided" });
	if (!["xp", "level"].includes(type)) throw new XpFatal({
		function: "convertFrom()", message: "Invalid type provided"
	});
	if (!Number.isFinite(xp.xp_rate) || xp.xp_rate <= 0) throw new XpFatal({
		function: "convertFrom()", message: "xp_rate must be a finite number greater than 0"
	});

	if (type === "level") return Math.pow(Math.max(0, value) / xp.xp_rate, 2);
	return Math.floor(xp.xp_rate * Math.sqrt(Math.max(0, value)));
}

/** MongoDB aggregation expression for the level of a user with `xpExpr` XP. Keep in step with `convertFrom()`. */
export const levelFromXpExpr = (xpExpr: unknown): Document => ({
	$floor: { $multiply: [xp.xp_rate, { $sqrt: xpExpr }] }
});

/** MongoDB aggregation expression for the XP a user needs to reach `levelExpr`. Keep in step with `convertFrom()`. */
export const xpFromLevelExpr = (levelExpr: unknown): Document => ({
	$pow: [{ $divide: [levelExpr, xp.xp_rate] }, 2]
});

/** SQL for the level of a row's `xp`; the one `?` is the XP rate. Keep in step with `convertFrom()`. */
export const LEVEL_FROM_XP_SQL = "CAST(floor(? * sqrt(CASE WHEN COALESCE(xp, 0) < 0 THEN 0 ELSE COALESCE(xp, 0) END)) AS INTEGER)";
