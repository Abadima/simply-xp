/** True for any non-null object, whatever a JavaScript caller passed. */
export const isRecord = (value: unknown): boolean => typeof value === "object" && value !== null;

/**
 * True for what can name a user or a guild: a string, number or bigint.
 * An object would reach MongoDB as a query operator (`{ $ne: "" }` matches every user).
 */
export const isIdentifier = (value: unknown): boolean =>
	typeof value === "string" || typeof value === "number" || typeof value === "bigint";
