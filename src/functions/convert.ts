import {XpFatal} from "./xplogs";

/**
 * Convert XP to level and vice versa.
 *
 * @param {"xp" | "level"} type - Type to convert from. Use either "xp" or "level".
 * @param {number} value - Value to convert.
 * @link https://simplyxp.js.org/docs/convert Documentation
 * @returns {number} - The converted value. (XP to level or level to XP)
 * @throws {XpFatal} If an invalid type is provided or if the value is not provided.
 */
export function convert(type: "xp" | "level", value: number): number {
	if (type !== "xp" && type !== "level") throw new XpFatal({function: "convert()", message: "Invalid type provided"});
	if (!value) throw new XpFatal({function: "convert()", message: "Value was not provided"});

	if (type === "level") return Math.pow(value / 0.1, 2);
	if (type === "xp") return Math.floor(0.1 * Math.sqrt(value));

	throw new XpFatal({function: "convert()", message: "Invalid type provided"});
}