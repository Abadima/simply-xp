// noinspection SpellCheckingInspection

import { copyFile, mkdir, readdir, readFile, writeFile } from "fs/promises";
import { minify } from "uglify-js";

const directories = ["lib/src/", "lib/src/classes/", "lib/src/functions/"];

// tsc only emits .js/.d.ts, so non-code assets have to be copied into lib/ ourselves.
// cards.ts/charts.ts resolve these at runtime via join(__dirname, "fonts", ...).
const assets = [["src/fonts/Baloo2-Regular.woff2", "lib/src/fonts/Baloo2-Regular.woff2"]];

async function processDirectory(directory) {
	const files = await readdir(directory);

	for (const file of files) {
		if (!file.endsWith(".js")) continue;

		const filePath = directory + file;
		const source = await readFile(filePath, "utf8");
		const result = minify(source, {
			compress: {
				collapse_vars: true,
				if_return: true,
				hoist_funs: true,
				hoist_vars: true,
				join_vars: true,
				negate_iife: true,
				passes: 2,
				pure_funcs: [
					"classCallCheck",
					"_classCallCheck",
					"_possibleConstructorReturn",
					"Object.freeze",
					"invariant",
					"warning"
				],
				reduce_funcs: true,
				reduce_vars: true
			},
			output: { comments: /^!|@returns/u },
			keep_fargs: false
		});

		if (result.error) {
			console.error(`Error compressing ${file}: ${result.error}`);
			continue;
		}

		await writeFile(filePath, result.code, "utf8");
	}

	console.log(`[INFO] Compressed all files in ${directory}.`);
}

async function copyAssets() {
	for (const [source, destination] of assets) {
		await mkdir(destination.slice(0, destination.lastIndexOf("/")), { recursive: true });
		await copyFile(source, destination);
		console.log(`[INFO] Copied ${source} -> ${destination}.`);
	}
}

async function main() {
	for (const directory of directories) {
		await processDirectory(directory);
	}

	await copyAssets();
}

void main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});