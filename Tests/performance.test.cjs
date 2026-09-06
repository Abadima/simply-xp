const { XpLog } = require("../lib/src/functions/xplogs");
const { Logena } = require("logena");
const fs = require("node:fs");
const xp = require("../lib/xp");

Logena.set({
	appName: "S-XP TESTS",
	colors: {
		appName: "magenta"
	},
	useTimestamps: true
})

const BOX_WIDTH = 40;
const TEST_FALLBACK_FONT = "Tests/assets/fonts/kiwi-maru-japanese-400-normal.woff";
const ABADIMA_PFP = "Tests/assets/imgs/Abadima.png";
const RANK_CARD_MODES = ["modern", "legacy"];
const COMPARE_CARD_THEMES = ["dark", "light"];
const LEADERBOARD_TYPES = ["leaderboard", "bar", "doughnut", "pie"];
const CHART_THEMES = ["blue", "dark", "discord", "green", "light", "orange", "pink", "red", "space", "yellow"];

let areXpEventsBound = false;

function padCenter(str, width) {
	const pad = width - str.length;
	const left = Math.floor(pad / 2);
	return " ".repeat(left) + str + " ".repeat(pad - left);
}

function printSep(tag, label) {
	Logena.info(`[${tag}] ${"━".repeat(19)} ${label} ${"━".repeat(19)}`);
}

function formatMemory(memoryUsage) {
	const total = memoryUsage.heapUsed + memoryUsage.external;
	return `${bytesToMB(total)} MB total (heap: ${bytesToMB(memoryUsage.heapUsed)} MB, ext: ${bytesToMB(memoryUsage.external)} MB)`;
}

function printSuiteSummary(iterations, dbType, memoryReadings, durations) {
	const totals = memoryReadings.map((reading) => reading.heapUsed + reading.external);
	const avgTotal = totals.reduce((runningTotal, currentReading) => runningTotal + currentReading, 0) / totals.length;
	const peakTotal = Math.max(...totals);
	const avgMs = durations.reduce((totalDuration, currentDuration) => totalDuration + currentDuration, 0) / durations.length;

	Logena.info(`[SUITE] ╔${"═".repeat(BOX_WIDTH)}╗`);
	Logena.info(`[SUITE] ║${padCenter("SIMPLY-XP JS MEMORY TEST SUITE", BOX_WIDTH)}║`);
	Logena.info(`[SUITE] ║${padCenter(`${iterations} iterations • ${dbType}`, BOX_WIDTH)}║`);
	Logena.info(`[SUITE] ╠${"═".repeat(BOX_WIDTH)}╣`);

	for (let index = 0; index < memoryReadings.length; index++) {
		const total = memoryReadings[index].heapUsed + memoryReadings[index].external;
		Logena.info(`[SUITE] ║${padCenter(`Run ${index + 1}: ${bytesToMB(total)} MB total • ${msToSec(durations[index])}s`, BOX_WIDTH)}║`);
	}

	Logena.info(`[SUITE] ╠${"═".repeat(BOX_WIDTH)}╣`);
	Logena.info(`[SUITE] ║${padCenter(`Avg: ${bytesToMB(avgTotal)} MB • ${msToSec(avgMs)}s  Peak: ${bytesToMB(peakTotal)} MB`, BOX_WIDTH)}║`);
	Logena.info(`[SUITE] ╚${"═".repeat(BOX_WIDTH)}╝`);
}

function bindXpEvents() {
	if (areXpEventsBound) {
		return;
	}

	areXpEventsBound = true;
	xp.XpEvents.on({
		levelDown: (data, lostRoles) => {
			XpLog.info("[LEVEL DOWN]", `${data.name} leveled down to ${data.level} • Lost: ${lostRoles.join(", ") || "None"}`);
		},
		levelUp: (data, newRoles) => {
			XpLog.info("[LEVEL UP]", `${data.name} leveled up to ${data.level} • New: ${newRoles.join(", ") || "None"}`);
		}
	});
}

async function test() {
	/*
		await xp.create("1234567890", "0987654321", "Abadima")

		await xp.create("1234567891", "0987654321", "Elizabeth");

		await xp.create("1234567892", "0987654321", "Jena").then(console.log)

		await xp.create("1234567893", "0987654321", "Rahul");

		await xp.create("1234567894", "0987654321", "Snowball");
	*/

	await xp.LevelRoles.add("0987654321", { level: 70, roles: ["01"] });

	await xp.addLevel("326815959358898189", "0987654321", 69, "アバディマ️");

	await xp.setFlags("326815959358898189", "0987654321", ["admin"], "アバディマ️");

	await xp.addXP("326815959358898189", "0987654321", 13900);

	await xp.removeXP("326815959358898189", "0987654321", 1);

	await xp.setLevel("1234567896", "0987654321", 66, "Rahul");

	await xp.addXP("1234567896", "0987654321", 13700, "Rahul");

	await xp.setLevel("1234567895", "0987654321", 52, "Jena");

	await xp.setLevel("1234567894", "0987654321", 25, "Parker");

	await xp.setLevel("1234567893", "0987654321", 15, "xun");

	await xp.addLevel("1234567892", "0987654321", 10, "Simply-XP");

	await xp.LevelRoles.add("0987654321", { level: 1, roles: ["01"] })

	await xp.LevelRoles.getGuildRoles("0987654321");

	await xp.LevelRoles.delete("0987654321", { level: 1 });

	// log JavaScript process memory components
	Logena.info(`[MEM] Before: ${formatMemory(process.memoryUsage())}`);

	// ALL CARD TESTS
	for (const mode of RANK_CARD_MODES) {
		const rankResult = await xp.rankCard(
			{ id: "0987654321", name: "SimplyTests" },
			{
				avatarURL: ABADIMA_PFP,
				id: "326815959358898189", username: "アバディマ"
			},
			{
				fallbackFont: TEST_FALLBACK_FONT,
				light: true, legacy: mode === "legacy"
			});
		fs.writeFileSync(`Tests/Images/rankCard/${mode}.webp`, rankResult.attachment);
	}

	for (const theme of COMPARE_CARD_THEMES) {
		const compareResult = await xp.compareCard(
			{ id: "0987654321", name: "SimplyTests" },
			{
				avatarURL: ABADIMA_PFP,
				id: "326815959358898189", username: "Abadima"
			},
			{
				avatarURL: "data:image/webp;base64,UklGRroOAABXRUJQVlA4WAoAAAAQAAAAAAEAAAEAQUxQSMcCAAABoJZte942eyCIwR4IhSAGDYKJwRoENgMrCOQx6BAoDFIEkRkIwv1se/Phr+n+9yYiJkA2qYdjHM/TZO04fZ0/49G/yb/QvQ+5ArAWBVDzcNBd88MFsNYFLoPfKT9UWCujJL87riuwtkYJuic+VVh7A0n3wmdYqyPpHmiGtTySbs0NsNZH0k2FCmt/lLAdzTAOkXQj36vRiBK24AYYkxjc6vQK4xJXXZmvxmfxq/oBYxTdijoYp+hW08FYRbeSDsYrulV0MGbRraCDcYtusQ7GLj4W8jB+4RfRYgxXXcBdjeOrm28ASRhmCzCW8X0mLcZz1XkSiLI8S4AxjTCDFuO6uucSyMLwlMLYhj6TjO/8hIIw+MeSMZ4fUlAG/0gyztMDCtKquxdYQ3+vGOvljgdt8LeS8R5vFeLqDQ/i4P8Tjfn4nwt1FxFRUAcnciDvXSQa91Ekk5dFKnlV3kAevnn6Dkf6jidj//RJ33im7/xF3zTxZy//v/z/8v/L/y//v/z/8v/L//8/dqJv4u/rTN/5J32/TvSdjiAPxwN9Xul7k0peFcnkZZFIXhR5B3U4iDjyVEQu1F1ERCJ18T8exMH/RypxRW5G4tItD9rgb0mhrcjdHqQh3HOVNb0nI2lJHvSgDPqIZMqSPOxBGPQxyYQleVJBF/QZiWwhydOuklX0OQmgCkHmzEwhyaxaiSo6jwTQhCBzR5CEKLO7K0lXN59opaioLOlBELws+wF60MvSPchBL8v3oAa9rLEHMehlnT1oQS9r7UEKellvD0rwIWv2hZDqZd16BRm4qqzdRVCB6GSDoRBRg2xTR5CArLLZUCioQbasI5oP0cnGdUTTIavsoI5oNmQvO6kj0GCoycuOaihoLJTeyd76saCZUKOXffbxAjQPcIle9lwPMVcATQKg5vju5F/45o+nz/PX1BDTdB5Px4PKJgEAVlA4IMwLAADwSwCdASoBAQEBPm02l0ikIyIhIrSp4IANiWVu+F9JAe2tvBatRJsf3e79BqK5vPaPP3n89NW3f8x/nY+nT0C/6X1NPogdL3+3X7IeyBqq/oazztAe0mXMET5O/3QyOHkfAn+8b3sZ3wgZBkIFwf+DJSVp7LSrllOrs0DIMhFF8do7AZ+/msUb8HX0WR2VHZjO/F+6mdpexldCH7CYN9Fa8AmPYwhVR8Y48IHWlRNFsk6J2ceSvkKr5FSLdpjF3FiF4z0WVxZ1LPKvLE+Bcv0TlL80CvgczqhStsuQANhtEX9pLnXRy9Tkcz4NopWE42WS0ZfPGLoIjTd5NASSdNz16GSQeMvG49jsZsGTesLoI2zw2hRb0Rf/KettN089apBjdB6DWGPhVgNEWwQ/pvDISdhOXbrXxuztf1iJ76sVWIAObSmn0jSM+fANAi2wzAfHpWaImTtY5q2O2eAqYclDebK7q9RZOJT8XQ2BzwQK+FpUNvjtkclRbqJKpcyIk9TbwDOv34FroofI7pOS14+/dIlMO/42P6dGs9Fj/Lvv1HEiWOmi52VPEdIqohwdiPtd/9DVSnFTwZ6FBp4Qe6tQLvMSdvrt8WaA0xJVbx/6xozyKi5Upwi8mWya1BsLG8bp7axNvpA5cOBWH1lp4DBJiYrKc4cNGRYxEfxkdv6+TlecDC4qdCoAUKXUSUnmIjDzA7l+6SM+VGkm5xEfiPeiz2+2ImtNmjmG4SPIQ7sVSc771jcFFRxmW0pQxqb60fjmmK0c2+7GTd6kZPm8gSMi2gIi3cIwlyLop+XDTHZZ4dq2VHJSXZUAAP78rbaxf0m1And/TU6kALa5kRvk9UYXuqevdn9l+K+xbvKIRStOqmKgxY4W9NoRw7ezt1MlTiEACqvdRdiF4akD7nnjjvAl7h3Dktivl1eYgbxE4FLRMWMk8RZMLyDFkTVOSJ4twpFePWjFN6D/oZMN8A/pc8/TVqEunxMOfwRHOWe/6QAPdRy8DLlQ70Bp2aCqQNVf/3/B0zqgTf4ScZ4ctdc1e49oVQ1dy+8zxXYWMtHGPJ2BIECR7BArcKaWpg3PRIOVCmddbFPa6JOL6aREuljA6totg04ndVDrOxM/MVrlAdFb6FUrWeh0aSjH3clDgD+nrci/1bUyxl63m1qLBjAULKeGzmW1mdPT6JhWGmbNPW+7dHWb3yqZ8uRZyyAurFkYnPwlvW7aWbjVjzMV/4RHMHUpll6JAxmgb4h7ZsOaxaNqZKlqFgE+tDpbH8CUta2qo1lYJ807hdu+faqmkB32yphGVtIHu6dzhEj6e2CaTiIxPcI8gxNF89ObQZOoKyhSYRco8BEqLRd7jl5301yaz6aWTIGJSY7Vgt1FA63bSUbAan506WlEXDpnKWbL7eZNJT+SsBxZAmxtxnYtxeNRaZ9PKbWaov6cQRGeoLvCAwW2okr0HGyNX+wQ/KB4M978Pkk7l1hLnTLSTmjJOsaTTAfKNLwKUUTeAwSfDcC6fEPk4DsR1uLWrpzF9bbBfs26O5PSB55ebO5t+yAG7BLPvXHS84/+ZwXz1Tt19GDt0V43/XSve9eMGJ/WIt8HiDR5K7F24emEtI59eUGJlPlM+riUpAXlg2evI9IEUDVX/9/wfS3Dppa+kBIXz2Stm5j6TllPazI2KKkirmK0znjbZVxuvTHc5wL7aJ1h4RQqRLpH5px7PJrPweEgmLr70MqqyMOsJhhnTyl0Sh/KMOi6/qL+f8okyst7/Yp8mk3DH2+RdSXBqdmW3BRXDygKJPOnsADv+c9CF7GhVT7Qbh6pW0WTbaPrzlytdLabthHEzQ3U1KY7ev0DWzsbgM8p0I9lTeUC9nME381uOGG85VZ5dwwTMlTye3Kkahz0VDBFYt+FWU06CwZ9ivpVV6U5hJNLPKs5QdnuizmMyCfYciDln6F4DjMsdMPQqckygQQ0xqXtkxlJLIx8p2wp1cozXVP9yOlPB6I6bw/VAv8xSkI3FCTMl1wvQFeclK9634xrdIM+eCzrGk4apgKdI9GnQrMHDLuDBpivEOtA1XdUGf8qAhf4ZW/lB6VfTY2RfKFjSd82YzPxzM/LEZUnmPXKaw2QlQ7UB91f3odre/ebTbwzAvB78nsTk7g6DuI0A4ZubmvV0OBG0q9zc+rNeSdYDmwCvaZEEj7xVOHKJCges/p66FEwssmpoJ0eENCVF54wQu6q88ktBHlDDhspt5enCj2JSLI7uva1bI+gEkoq4bP+j76W7gSjJ3vpB1D3R12AnXg30y+0W0+nEFzHDODo+TwfVszUthOtQ9pc1b3/xtS1hpAsU8GZnnYrsW3LRa31TFMZoZWM6LLxYiJ8loI1bAkOPxdA1rvomc0R7xQcrnYro+fm0WE7XcjjJxuD9E4TR+1drI5GWRbZCtz7VKmSncoBiLZwoqHoAgRK/fHc8aDJzamk8HGY+bEjjkpAunC8PwYfwQb0W9Svf8x43r9A3HW+vcDbh4ofxq4v9tBseF9OIX4USa8lty/DR66FOo1J1W7SIann/Fxyp7hrO1oDa0YHEoKAP9bIoHMZ8DHtYie9WNbyJ8Wk1cyH/2XwFVdjrZkhD1az89qhkJQSL629SPVBj0gAJRwy2PA70AbCKA9yDfBZZUhhdnqriDsgNY1jkMqBrnAQ5iniGL44xkzaJFjVcGe394qwwDtmXplc1TYFci+hDNVt0S456JGD9hFZm01d2s8EItTa/zUVaV4HUlBjqYmuH1Pqm5Zs3xR4Rzyhg5SdTAM5JrV2fVBwQXWSZJDPg0/pcI0DbFqx/0vLT4b6c0YvwSiX1SRhYRHzVCoOlQlEArVpctctv0yErXYNj1KTx7D/RoKLJR/Z4xVzcx+MfVJ8RfR2iokSD2y11Y4UiY0sUa0VDiFSAYSNvXZtRq/D6mahIP8gZuuRg5Sr55rgNEAgnaE52z7v4bPoadqirUkO4RRwXNlwNR6ClFxy/6LI65ScB28bXRGtSsiHfC0pVgJ/V6YPPXyFWev3kZap7oAMPir0hN+mGqvWX4ru2I4DDUFjCJa+i5NcWnhM3g/ar6MiPjWCH4L0nGpws/63+Xcu3zBuFpihWb7o34LXu8bdgIMjneemV1kITrAXR24CpylOLrDUqdoN/qo36SK/HYg0uhj5rNkaVBNxF5x+5KEuvw3L/tt8+JqL6Qi2oObYSttS5cHbLmfg5oirWjbP2/lWL7/nGF9QxIGJ+qc1H9uviiqewMf1DA4Io9A+6t9JFmxCOoT0B6b8IDi3nlshTu1fzW5IFYiFBv+xJrqKoixJgBliL2UF4Ds/excZtk4LPvX3wrb6o122N2vcgkGEmfx1+zlYiBBnuWZNU7VQ8lXIRuhZQozSXJVioY2A7mpOsbJ8wD4NW5wPeOqsro44f0y/JIVow8E2S34pyDwRMdFGy+NNpQhoSryX+ys/4bSAW9g4i9Ndo5t//dKZEV4Nffhi8zHPIhVyTcUbAtYUiM6mGHQ993G5OC2u0eIWASqxvbUEliak8isG3ejecvK7jnNnn6ve358MMV6Fyc4DtNxL/4Dn48B1PGj8qJUIL7JtSMDF0Xakca0LOmCm2+ef9fgqJ8lb+8kOm5oAzRR42lCKkYnsHz+pL9xhJAz7cOZVTEi6u0T8nEfFzzfsaTPnqrsXxEiiYtG6zid9XIu4yHKdSAvHPO3OlYNFUVbnZqdYudgbbIICauaopfLqytDmJ1tBaGzUzu7nJindABGWvmBXF1wALAw8mBab1XCEo1A+wvd40yPtokCN0O0PMOLdtBVYI1lUWupT64/fJ2c6UYCXrxc9CffTOuYa0fynAR9Ls4vMqdOBjnkKQjfzOHsQo6MLB8dRdOi7Xa0YyoN6FXn7+b0/vDc1rZS0p7W+m+TrYNJ3ffQMW0UVgajBKVYdiMflLUpAJsaR9us3BIEgRwhDJp3mQgoXAn3OzXO/E7Y5ek70rKwow1NH1AUHKW4qEwFOodJaHW9AAQzYVUA7SBWnBAOoyU8wnfa6wAAAAA==",
				id: "1234567896", username: "Rahuletto"
			},
			{
				fallbackFont: TEST_FALLBACK_FONT,
				light: theme === "light"
			});
		fs.writeFileSync(`Tests/Images/compareCard/${theme}.webp`, compareResult.attachment);
	}

	for (const type of LEADERBOARD_TYPES) {
		if (type === "leaderboard") {
			for (const theme of COMPARE_CARD_THEMES) {
				const leaderboardResult = await xp.leaderboardCard(await xp.leaderboard(), {
					// artworkImage: "https://th.bing.com/th/id/R.8cd8594560bd9cf4b042833a4acefaa5?rik=A6B1qYN%2b5GQAcA&riu=http%3a%2f%2fwallpaperswide.com%2fdownload%2fdesert_sky-wallpaper-2560x720.jpg&ehk=rE5VYZy8njd5ZeNT2p4sP7C5psjSf%2bxLZmV%2bvlQCffs%3d&risl=&pid=ImgRaw&r=0",
					//backgroundImage: new URL("https://static.vecteezy.com/system/resources/previews/000/962/809/original/abstract-gradient-background-with-colorful-and-modern-style-vector.jpg"),
					fallbackFont: TEST_FALLBACK_FONT,
					light: theme === "light",
					rowOpacity: 1
				}, {
					name: "Development Hub",
					imageURL: ABADIMA_PFP,
					memberCount: 20
				}, {});
				fs.writeFileSync(`Tests/Images/Leaderboards/standard/${theme}.webp`, leaderboardResult.attachment);
			}
		} else {
			for (const theme of CHART_THEMES) {
				const chartResult = await xp.charts("0987654321", {
					fallbackFont: TEST_FALLBACK_FONT,
					theme: theme, type: type
				});
				fs.writeFileSync(`Tests/Images/Leaderboards/${type}/${theme}.webp`, chartResult.attachment);
			}
		}
	}

	// log JavaScript process memory components (pre-cleanup peak)
	Logena.info(`[MEM] After: ${formatMemory(process.memoryUsage())}`);

	await xp.Database.deleteMany({
		collection: "simply-xps", data: {
			guild: "0987654321"
		}
	});

	await xp.Database.deleteMany({
		collection: "simply-xp-levelroles", data: {
			guild: "0987654321"
		}
	});

	Logena.info("[DONE] Test iteration complete.");
	const { heapUsed, external } = process.memoryUsage();
	return { heapUsed, external };
}

/**
 * 
 * @param {number} iterations 
 * @param {"mongodb"|"sqlite"} dbType 
 */
async function runTests(iterations = 5, dbType = "sqlite") {
	const memoryReadings = Array.from({ length: iterations });
	const durations = Array.from({ length: iterations });

	await xp.connect(dbType === "sqlite" ? "Tests/test.sqlite" : require("../secrets.cjs").MongoURI, {
		auto_create: true,
		debug: false,
		notify: false,
		type: dbType
	});

	await xp.registerPlugins([
		{
			name: "test",
			initialize: async () => {
				XpLog.info("test_plugin", "Initialized!");
			},
			requiredVersions: ["2"]
		}
	]);

	bindXpEvents();

	for (let index = 0; index < iterations; index++) {
		const runNumber = index + 1;
		printSep("RUN", `RUN ${runNumber}/${iterations} START`);

		const t0 = performance.now();
		const memory = await test();
		durations[index] = performance.now() - t0;
		memoryReadings[index] = memory;
		const total = memory.heapUsed + memory.external;

		Logena.info(`[RUN] ${runNumber}/${iterations} complete • ${bytesToMB(total)} MB total (heap: ${bytesToMB(memory.heapUsed)} MB, ext: ${bytesToMB(memory.external)} MB) • ${msToSec(durations[index])}s`);

		await new Promise(resolve => setTimeout(resolve, 1500));
	}

	printSep("SUITE", "ALL TESTS COMPLETE");
	printSuiteSummary(iterations, dbType, memoryReadings, durations);
	Logena.info("[SUITE] Goodbye :)");
	process.exit(0);
}

const requestedDbType = process.argv[2] === "mongodb" ? "mongodb" : "sqlite";
const requestedIterations = Number(process.argv[3]);
const iterations = Number.isInteger(requestedIterations) && requestedIterations > 0 ? requestedIterations : 10;

runTests(iterations, requestedDbType);

function bytesToMB(bytes) {
	return Math.round(bytes / 1024 / 1024 * 100) / 100;
}

function msToSec(ms) {
	return Math.round(ms / 10) / 100;
}