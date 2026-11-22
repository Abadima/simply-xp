import { XpFatal, XpLog } from "./xplogs";
import { readFile } from "fs/promises";
import { dirname, join } from "path";

/**
 * Supported major version range for each database adapter.
 * @private
 */
export const ADAPTER_VERSION_RANGES = {
	"better-sqlite3": { min: 7, max: 13 },
	mongodb: { min: 4, max: 7 },
} as const;

const ADAPTERS = {
	mongodb: { display: "MongoDB", packageName: "mongodb", ...ADAPTER_VERSION_RANGES.mongodb },
	sqlite: { display: "better-sqlite3", packageName: "better-sqlite3", ...ADAPTER_VERSION_RANGES["better-sqlite3"] },
} as const;

async function readInstalledPackage(packageName: string): Promise<{ version?: unknown } | null> {
	let entryDirectory: string;

	try {
		entryDirectory = dirname(require.resolve(packageName));
	} catch {
		return null;
	}

	// The package's own folder is somewhere above its entry file; `dirname` of the root is the root itself.
	const directories: string[] = [];
	for (let directory = entryDirectory; !directories.includes(directory); directory = dirname(directory)) directories.push(directory);

	for (const directory of directories) {
		try {
			// eslint-disable-next-line security/detect-non-literal-fs-filename -- the folder comes from require.resolve() of a fixed package name, never from input
			const metadata = JSON.parse(await readFile(join(directory, "package.json"), "utf8")) as { name?: string; version?: unknown };
			if (metadata.name === packageName) return metadata;
		} catch (error) {
			if (!(error instanceof Error) || (error as NodeJS.ErrnoException).code !== "ENOENT") return null;
		}
	}

	return null;
}

function missingAdapter(caller: string, packageName: string): XpFatal {
	const adapterName = packageName === "mongodb" ? "MongoDB" : packageName === "better-sqlite3" ? "SQLite" : packageName;
	return new XpFatal({
		code: "SX_ADAPTER_MISSING",
		function: caller,
		message: `Missing required package "${packageName}". simply-xp needs it to connect to ${adapterName}. Install it with: npm install ${packageName}`,
	});
}

/**
 * Check database package versions
 * @private
 * @param {string} type - NPM Package Name (lowercase)
 * @param {number} min - Minimum Major Version Number
 * @param {number} max - Maximum Major Version Number (Optional)
 * @returns {Promise<"too_low" | "ok" | "too_high">} - Version Status
 * @throws {XpFatal} `SX_ADAPTER_MISSING` when the package is not installed.
 */
export async function checkPackageVersion(type: string, min: number, max?: number): Promise<"too_low" | "ok" | "too_high"> {
	const installedVersion = (await readInstalledPackage(type))?.version;
	if (typeof installedVersion !== "string") throw missingAdapter("checkPackageVersion()", type);

	const majorVersion = parseInt(installedVersion.split(".")[0] ?? "", 10);
	if (majorVersion < min) return "too_low";
	if (max && majorVersion > max) return "too_high";
	return "ok";
}

/**
 * Throws unless the adapter's package is installed and new enough; warns when it is newer than tested.
 * @private
 * @throws {XpFatal} `SX_ADAPTER_MISSING` when the package is not installed.
 */
export async function requireSupportedAdapter(caller: string, adapter: keyof typeof ADAPTERS): Promise<void> {
	const { display, packageName, min, max } = adapter === "mongodb" ? ADAPTERS.mongodb : ADAPTERS.sqlite;
	const name = packageName.toUpperCase();

	switch (await checkPackageVersion(packageName, min, max).catch((error: unknown) => {
		if (error instanceof XpFatal && error.code === "SX_ADAPTER_MISSING") throw missingAdapter(caller, packageName);
		throw error;
	})) {
		case "too_low":
			throw new XpFatal({ function: caller, message: `${name} V${min} OR NEWER IS REQUIRED` });
		case "too_high":
			XpLog.warn(caller, `${name} VERSION IS NEWER THAN TESTED (V${max}) -- CONTINUE WITH CAUTION`);
			break;
		case "ok":
			XpLog.debug(caller, `${display} is natively compatible with our package! 🎉`);
	}
}
