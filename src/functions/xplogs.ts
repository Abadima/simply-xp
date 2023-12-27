import { xp } from "../../xp";
import { UserResult } from "./database";

type errOptions = {
	function: string;
	message: string | Error;
}

/**
 * Emits a fatal error message
 * @class XpFatal
 */
export class XpFatal extends Error {
	/**
	 * Emits a simple error message
	 * @param {errOptions} options
	 * @private
	 */

	constructor(options: errOptions) {
		super(`${options.function}: ${options.message}`);
	}
}

Object.defineProperty(XpFatal.prototype, "name", {
	value: "SimplyXpFatal",
});

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
		const logColor = {
			debug: "\x1b[36m", // Cyan
			info: "\x1b[34m", // Blue
			error: "\x1b[31m", // Red
			warn: "\x1b[33m" // Yellow
		};

		const callback = XpEvents.eventCallback?.[level],
			logLevel = level.toUpperCase(), logCommand = xpFunction.toUpperCase();
		if (callback && typeof callback === "function") {
			callback(xpFunction, message);
		} else {
			console.log(`\x1b[35m[SIMPLY XP]\x1b[0m ${logColor[level]}(${logLevel})\x1b[0m ${logCommand}: ${message}`);
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

export type XpEventCallback = {
	custom: (message: string) => void;
	debug: (xpFunction: string, message: string) => void;
	error: (xpFunction: string, message: string) => void;
	info: (xpFunction: string, message: string) => void;
	levelDown: (data: UserResult, lostRoles: string[]) => void;
	levelUp: (data: UserResult, newRoles: string[]) => void;
	warn: (xpFunction: string, message: string) => void;
};

/**
 * Event handler for XP events
 * @class XpEvents
 * @public
 */
export class XpEvents {
	static eventCallback: XpEventCallback;

	static on(callbacks: XpEventCallback): void {
		XpEvents.eventCallback = callbacks;
	}
}