import {xp} from "../../xp";

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
 */
export class XpLog {
	/**
	 * Emits a log message with the specified level
	 * @param {("debug" | "error" | "info" | "warn")} level - The log level (e.g., 'info', 'error', 'warn')
	 * @param {string} command - The command or context of the log message
	 * @param {string} message - The log message
	 * @private
	 */
	static log(level: ("debug" | "error" | "info" | "warn"), command: string, message: string) {
		const logColor = {
			debug: "\x1b[36m", // Cyan
			info: "\x1b[34m", // Blue
			error: "\x1b[31m", // Red
			warn: "\x1b[33m" // Yellow
		};

		const logLevel = level.toUpperCase(), logCommand = command.toUpperCase();
		console.log(`\x1b[35m[SIMPLY XP]\x1b[0m ${logColor[level]}(${logLevel})\x1b[0m ${logCommand}: ${message}`);
	}

	/**
	 * Emits a debug log
	 * @param {string} command - The command or context of the log message
	 * @param {string} message - The log message
	 * @private
	 */
	static debug(command: string, message: string) {
		if (xp.debug) XpLog.log("debug", command, message);
	}

	/**
	 * Emits an info log
	 * @param {string} command - The command or context of the log message
	 * @param {string} message - The log message
	 * @private
	 */
	static info(command: string, message: string) {
		if (xp.notify) XpLog.log("info", command, message);
	}

	/**
	 * Emits an error log
	 * @param {string} command - The command or context of the log message
	 * @param {string} message - The log message
	 * @private
	 */
	static err(command: string, message: string) {
		XpLog.log("error", command, message);
	}

	/**
	 * Emits a warning log
	 * @param {string} command - The command or context of the log message
	 * @param {string} message - The log message
	 * @private
	 */
	static warn(command: string, message: string) {
		XpLog.log("warn", command, message);
	}
}