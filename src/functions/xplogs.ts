import type { UserResult } from "../classes/Database";
import { isRecord } from "./predicates";
import { xp } from "../client";

type errOptions = {
	code?: string;
	function: string;
	message: string | Error;
}

/**
 * The error simply-xp throws: its message starts with the function that failed.
 * @class XpFatal
 */
export class XpFatal extends Error {
	readonly code: string;

	/**
	 * @param {errOptions} options - The failing function, a message and an optional error code
	 * @private
	 */
	constructor(options: errOptions) {
		super(`${options.function}: ${String(options.message)}`);
		this.code = options.code || "SX_FATAL";
	}
}

Object.defineProperty(XpFatal.prototype, "name", {
	value: "SimplyXpFatal",
});

export type XpEventCallback = {
	custom?: (message: string) => void | Promise<void>;
	debug?: (xpFunction: string, message: string) => void | Promise<void>;
	error?: (xpFunction: string, message: string) => void | Promise<void>;
	info?: (xpFunction: string, message: string) => void | Promise<void>;
	levelDown?: (data: UserResult, lostRoles: string[]) => void | Promise<void>;
	levelUp?: (data: UserResult, newRoles: string[]) => void | Promise<void>;
	warn?: (xpFunction: string, message: string) => void | Promise<void>;
};

/** Reads one event's handler off a callbacks object, with literal property names so no caller-supplied key is ever looked up. */
const HANDLER_OF = new Map<keyof XpEventCallback, (callbacks: XpEventCallback) => unknown>([
	["custom", (callbacks) => callbacks.custom],
	["debug", (callbacks) => callbacks.debug],
	["error", (callbacks) => callbacks.error],
	["info", (callbacks) => callbacks.info],
	["levelDown", (callbacks) => callbacks.levelDown],
	["levelUp", (callbacks) => callbacks.levelUp],
	["warn", (callbacks) => callbacks.warn]
]);

/**
 * Event handler for XP events
 * @class XpEvents
 * @public
 */
export class XpEvents {
	static eventCallback: XpEventCallback | undefined;
	private static extraListeners: XpEventCallback[] = [];

	/**
	 * Set the primary event callbacks, replacing any previously set with `on()`.
	 *
	 * Only one `on()` callback object exists at a time. If you are writing a plugin, or anything
	 * that has to coexist with other listeners, use {@link XpEvents.add} instead.
	 * @param {XpEventCallback} callbacks - The callbacks to set.
	 * @link `Documentation:` https://simplyxp.js.org/docs/Classes/XpEvents#xpeventson
	 * @returns {void}
	 */
	static on(callbacks: XpEventCallback): void {
		XpEvents.eventCallback = callbacks;
	}

	/**
	 * Add event callbacks without replacing existing ones.
	 *
	 * Unlike `on()`, any number of listeners can be added, so plugins and bot code can subscribe
	 * to the same events side by side.
	 * @param {XpEventCallback} callbacks - The callbacks to add.
	 * @link `Documentation:` https://simplyxp.js.org/docs/Classes/XpEvents#xpeventsadd
	 * @returns {() => void} Call the returned function to remove these callbacks again.
	 * @throws {XpFatal} If callbacks is not an object.
	 */
	static add(callbacks: XpEventCallback): () => void {
		if (!isRecord(callbacks)) throw new XpFatal({
			function: "XpEvents.add()", message: "Callbacks must be an object"
		});

		XpEvents.extraListeners.push(callbacks);

		return (): void => {
			const index = XpEvents.extraListeners.indexOf(callbacks);
			if (index !== -1) XpEvents.extraListeners.splice(index, 1);
		};
	}

	/**
	 * Collects every handler registered for an event, from `on()` first and then `add()`.
	 * @private
	 */
	static handlers<K extends keyof XpEventCallback>(event: K): NonNullable<XpEventCallback[K]>[] {
		const handlerOf = HANDLER_OF.get(event);
		const collected: NonNullable<XpEventCallback[K]>[] = [];
		if (!handlerOf) return collected;

		for (const listener of XpEvents.eventCallback ? [XpEvents.eventCallback, ...XpEvents.extraListeners] : XpEvents.extraListeners) {
			const handler = handlerOf(listener);
			if (typeof handler === "function") collected.push(handler as NonNullable<XpEventCallback[K]>);
		}

		return collected;
	}
}

const LOG_COLORS = new Map([
	["debug", "\x1b[36m"], // Cyan
	["info", "\x1b[34m"], // Blue
	["error", "\x1b[31m"], // Red
	["warn", "\x1b[33m"] // Yellow
]);

/**
 * Emits a log message
 * @class XpLog
 * @private
 */
export class XpLog {
	/**
	 * Emits a log message with the specified level
	 * @param {("debug" | "error" | "info" | "warn")} level - The log level (e.g., 'info', 'error', 'warn')
	 * @param {string} xpFunction - The command or context of the log message
	 * @param {string} message - The log message
	 * @private
	 */
	static log(level: ("debug" | "error" | "info" | "warn"), xpFunction: string, message: string) {
		const callbacks = XpEvents.handlers(level),
			logLevel = level.toUpperCase(), logCommand = xpFunction.toUpperCase();
		if (callbacks.length > 0) {
			for (const callback of callbacks) {
				void Promise.resolve(callback(xpFunction, message)).catch((error) => {
					console.error(`\x1b[35m[SIMPLY XP]\x1b[0m \x1b[31m(ERROR)\x1b[0m XPEVENTS: Callback failure in '${level}'\n${error}`);
				});
			}
		} else {
			console.log(`\x1b[35m[SIMPLY XP]\x1b[0m ${LOG_COLORS.get(level) ?? ""}(${logLevel})\x1b[0m ${logCommand}: ${message}`);
		}
	}

	/**
	 * Emits a debug log
	 * @param {string} xpFunction - The command or context of the log message
	 * @param {string} message - The log message
	 * @private
	 */
	static debug(xpFunction: string, message: string) {
		if (xp.debug) XpLog.log("debug", xpFunction, message);
	}

	/**
	 * Emits an info log
	 * @param {string} xpFunction - The command or context of the log message
	 * @param {string} message - The log message
	 * @returns {boolean} Returns true
	 * @private
	 */
	static info(xpFunction: string, message: string): boolean {
		if (xp.notify) XpLog.log("info", xpFunction, message);
		return true;
	}

	/**
	 * Emits an error log
	 * @param {string} xpFunction - The command or context of the log message
	 * @param {string} message - The log message
	 * @returns {boolean} Returns false
	 * @private
	 */
	static err(xpFunction: string, message: string): boolean {
		XpLog.log("error", xpFunction, message);
		return false;
	}

	/**
	 * Emits a warning log
	 * @param {string} xpFunction - The command or context of the log message
	 * @param {string} message - The log message
	 * @private
	 */
	static warn(xpFunction: string, message: string) {
		XpLog.log("warn", xpFunction, message);
	}
}