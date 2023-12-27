const xp = require("../lib/xp");
const {XpLog} = require("../lib/src/functions/xplogs");


const MongoURL = "mongodb+srv://test-bot:VoPMOHg4jBuvMYVP@test.k9xds.mongodb.net/?retryWrites=true&w=majority";

async function test(dbType) {
	xp.XpEvents.on({
		levelDown: (data, lostRoles) => {
			console.log(`[LEVEL DOWN] ${data.name} has leveled down to level ${data.level}! Lost roles: ${lostRoles.join(", ") || "None"}`);
		},
		levelUp: (data, newRoles) => {
			console.log(`[LEVEL UP] ${data.name} has leveled up to level ${data.level}! New roles: ${newRoles.join(", ") || "None"}`);
		}
	});

	await xp.connect(dbType === "sqlite" ? "Tests/test.sqlite" : MongoURL, {
		auto_clean: false,
		auto_create: true,
		debug: true,
		type: dbType
	});

	await xp.registerPlugins([
		{
			name: "test",
			initialize: async () => {
				XpLog.info("test_plugin", "Initialized!")
			},
			requiredVersions: ["2"]
		}
	]);

	/*
		await xp.create("1234567890", "0987654321", "Abadima")

		await xp.create("1234567891", "0987654321", "Elizabeth");

		await xp.create("1234567892", "0987654321", "Jena").then(console.log)

		await xp.create("1234567893", "0987654321", "Rahul");

		await xp.create("1234567894", "0987654321", "Snowball");
	*/

	await xp.roleSetup.add("0987654321", {level: 70, role: "01"});

	await xp.addLevel("326815959358898189", "0987654321", 69, "アバディマ");

	await xp.addXP("326815959358898189", "0987654321", 13900);

	await xp.removeXP("326815959358898189", "0987654321", 1)

	await xp.setLevel("1234567896", "0987654321", 68, "Rahul");

	await xp.addXP("1234567896", "0987654321", 13700, "Rahul");

	await xp.setLevel("1234567895", "0987654321", 52, "Kylie");

	await xp.setLevel("1234567894", "0987654321", 20, "Sammy");

	await xp.setLevel("1234567893", "0987654321", 15, "Jena");

	await xp.addLevel("1234567892", "0987654321", 10, "Jeremy");

	await xp.roleSetup.add("0987654321", {level: 1, role: "01"});

	await xp.roleSetup.remove("0987654321", 1);

	await xp.rankCard(
		{id: "0987654321", name: "SimplyTests"},
		{
			avatarURL: "https://i.ibb.co/WcfZPYL/Abadima.png",
			id: "326815959358898189", username: "アバディマ"
		},
		{light: true, legacy: false}).then(results => {
		require("fs").writeFileSync("Tests/rankCard.png", results.attachment);
	});

	await xp.compareCard(
		{id: "0987654321", name: "SimplyTests"},
		{
			avatarURL: "https://i.ibb.co/WcfZPYL/Abadima.png",
			id: "326815959358898189", username: "Abadima"
		},
		{
			avatarURL: "https://rahuletto.thedev.id/assets/logo.webp",
			id: "1234567896", username: "Rahuletto"
		},
		{light: true}).then(results => {
			require("fs").writeFileSync("Tests/compareCard.png", results.attachment);
		}
	);

	await xp.leaderboard().then(async (users) => {
		await xp.leaderboardCard(users, {
			// artworkImage: "https://th.bing.com/th/id/R.8cd8594560bd9cf4b042833a4acefaa5?rik=A6B1qYN%2b5GQAcA&riu=http%3a%2f%2fwallpaperswide.com%2fdownload%2fdesert_sky-wallpaper-2560x720.jpg&ehk=rE5VYZy8njd5ZeNT2p4sP7C5psjSf%2bxLZmV%2bvlQCffs%3d&risl=&pid=ImgRaw&r=0",
			//backgroundImage: new URL("https://static.vecteezy.com/system/resources/previews/000/962/809/original/abstract-gradient-background-with-colorful-and-modern-style-vector.jpg"),
			light: false,
			rowOpacity: 1
		}, {
			name: "Development Hub",
			imageURL: "https://cdn.discordapp.com/icons/950190034852646912/5a800bf4caf28bfcaccc214446b461c4.webp",
			//memberCount: 20
		}).then(results => {
			require("fs").writeFileSync("Tests/leaderboard.png", results.attachment);
		});
	});

	await xp.charts("0987654321", {
		theme: "discord", type: "bar"
	}).then(results => {
		require("fs").writeFileSync("Tests/charts.png", results.attachment);
	})

	await xp.db.deleteMany({
		collection: "simply-xps", data: {
			guild: "0987654321"
		}
	});

	await xp.db.deleteMany({
		collection: "simply-xps-levelroles", data: {
			guild: "0987654321",
			lvlrole: undefined
		}
	});
}

test("sqlite");