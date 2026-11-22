import { loadCanvas } from "./canvas";
import { xp, type Plugin } from "../client";
import { FALLBACK_FONT, PRIMARY_FONT } from "./draw";
import { isRecord } from "./predicates";
import { XpFatal, XpLog } from "./xplogs";
import { https } from "./https";
import { join } from "path";

/**
 * Registers fonts from URLs or paths (For convenience).
 * @param {string} pathOrURL - The path or URL to the font.
 * @param {string} name - The name of the font.
 * @param {number} [timeout=1500] - The timeout for the request.
 * @link `Documentation:` https://simplyxp.js.org/docs/Functions/registerFont
 * @returns {Promise<void>} - Nothing.
 * @throws {XpFatal} If an invalid path or URL is provided.
 */
export async function registerFont(pathOrURL: string, name: string, timeout: number = 1500): Promise<void> {
	if (xp.registeredFonts.includes(name)) return;
	const { GlobalFonts } = await loadCanvas();

	if (pathOrURL.startsWith("https://")) {
		await https(pathOrURL, {
			responseType: "stream", timeout: timeout
		}).then((font): void => {
			GlobalFonts.register(font as Buffer, name);
			xp.registeredFonts.push(name);
		}).catch((error): void => {
			throw new XpFatal({
				function: "registerFont()", message: `Failed to register font from URL\n${JSON.stringify(error)}`
			});
		});
	} else {
		GlobalFonts.registerFromPath(pathOrURL, name);
		xp.registeredFonts.push(name);
	}
}

/**
 * Registers the fonts the cards and charts draw with: the bundled one (or `font`) as "Baloo", plus an optional fallback.
 * @private
 */
export async function registerCardFonts(font?: string, fallbackFont?: string): Promise<void> {
	await registerFont(font || join(__dirname, "..", "fonts", "Baloo2-Regular.woff2"), PRIMARY_FONT);
	if (fallbackFont) await registerFont(fallbackFont, FALLBACK_FONT);
}

/** `"2"`, `"2.0"`, `"2.0.1"` or `"2.0.1-beta.4"` as its numbers and pre-release tag; `null` for anything else. */
function parseVersionPattern(version: string): { numbers: number[]; preRelease?: string } | null {
	const dash = version.indexOf("-");
	const core = dash === -1 ? version : version.slice(0, dash);
	const preRelease = dash === -1 ? undefined : version.slice(dash + 1);
	const parts = core.split(".");

	if (parts.length > 3 || !parts.every((part) => /^\d+$/u.test(part))) return null;
	if (preRelease !== undefined && !/^[\w.-]+$/u.test(preRelease)) return null;

	return { numbers: parts.map(Number), preRelease };
}

const registeredPlugins = new Map<string, Plugin>();

/**
 * Register Simply-XP Plugins.
 * @param {Plugin[]} plugins - The plugins to register.
 * @link `Documentation:` https://simplyxp.js.org/docs/Functions/registerPlugins
 * @returns {Promise<void>} - Resolves once all plugin initializers have completed.
 * @throws {XpFatal} If an invalid plugin is provided.
 */
export async function registerPlugins(plugins: Plugin[]): Promise<void> {
	if (!Array.isArray(plugins)) throw new XpFatal({
		function: "registerPlugins()", message: "Plugins must be an array"
	});

	const [rawVersionCore, xpPreRelease] = xp.version.split("-");
	const xpVersionCore = rawVersionCore ?? xp.version;
	const [xpMajor, xpMinor, xpPatch] = xpVersionCore.split(".").map((value) => parseInt(value, 10));

	await Promise.all(plugins.map(async (plugin): Promise<void> => {
		try {
			if (!isRecord(plugin)) {
				XpLog.warn("registerPlugins()", "INVALID PLUGIN PROVIDED");
				return;
			}

			const pluginName = typeof plugin.name === "string" && plugin.name.trim().length > 0 ? plugin.name.trim() : undefined;
			if (!pluginName) {
				XpLog.warn("registerPlugins()", "INVALID PLUGIN PROVIDED");
				return;
			}

			if (typeof plugin.initialize !== "function") {
				XpLog.warn("registerPlugins()", `${pluginName.toUpperCase()} PLUGIN NOT INITIALIZED: No initialize function provided.`);
				return;
			}

			if ((plugin as { functions?: unknown }).functions !== undefined) {
				XpLog.warn("registerPlugins()", `${pluginName.toUpperCase()} PLUGIN: 'functions' is deprecated and ignored.`);
			}

			if (Array.isArray(plugin.requiredVersions) && plugin.requiredVersions.length > 0 && !plugin.requiredVersions.includes(xp.version)) {
				let invalidVersioning = false;
				let passedChecks = false;

				for (const version of plugin.requiredVersions) {
					const pattern = parseVersionPattern(version);
					if (!pattern) {
						invalidVersioning = true;
						continue;
					}

					const [major, minor, patch] = pattern.numbers;
					if (major !== xpMajor) continue;
					if (minor !== undefined && minor !== xpMinor) continue;
					if (patch !== undefined && patch !== xpPatch) continue;
					if (pattern.preRelease && pattern.preRelease !== xpPreRelease) continue;

					passedChecks = true;
					break;
				}

				if (invalidVersioning) {
					XpLog.warn("registerPlugins()", `${pluginName.toUpperCase()} PLUGIN PROVIDED INVALID VERSION PATTERN(S) IN requiredVersions.`);
				}

				if (!passedChecks) {
					XpLog.warn("registerPlugins()", `${pluginName.toUpperCase()} PLUGIN NOT INITIALIZED: Requires: v${plugin.requiredVersions.join(", v")}`);
					return;
				}
			}

			await Promise.resolve(plugin.initialize(xp));
			registeredPlugins.set(pluginName, plugin);
			XpLog.info("registerPlugins()", `${pluginName.toUpperCase()} PLUGIN INITIALIZED`);
		} catch (error) {
			XpLog.err("registerPlugins()", `Failed to register plugin: ${plugin.name || "unknown"}\n${String(error)}`);
		}
	}));
}

/**
 * Unregister previously registered plugins, running each plugin's optional `destroy()`.
 *
 * Failures are isolated the same way registration is: one plugin throwing does not stop the rest.
 * @param {string[]} [names] - Plugin names to unregister. Omit to unregister all of them.
 * @link `Documentation:` https://simplyxp.js.org/docs/Functions/registerPlugins#unregisterplugins
 * @returns {Promise<void>} - Resolves once all matching plugins have been torn down.
 */
export async function unregisterPlugins(names?: string[]): Promise<void> {
	const targets = Array.isArray(names) && names.length > 0
		? names.map((name) => String(name).trim()).filter((name) => registeredPlugins.has(name))
		: [...registeredPlugins.keys()];

	await Promise.all(targets.map(async (name): Promise<void> => {
		const plugin = registeredPlugins.get(name);
		if (!plugin) return;

		try {
			if (typeof plugin.destroy === "function") await Promise.resolve(plugin.destroy(xp));
			XpLog.info("unregisterPlugins()", `${name.toUpperCase()} PLUGIN UNREGISTERED`);
		} catch (error) {
			XpLog.err("unregisterPlugins()", `Failed to unregister plugin: ${name}\n${String(error)}`);
		} finally {
			registeredPlugins.delete(name);
		}
	}));
}
