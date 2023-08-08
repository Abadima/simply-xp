const xp = require("../lib/xp.js");

const MongoURL = "mongodb+srv://test-bot:VoPMOHg4jBuvMYVP@test.k9xds.mongodb.net/?retryWrites=true&w=majority";

async function test(dbType) {

	switch (dbType) {
	case "mongodb":
		await xp.connect(MongoURL, {
			type: "mongodb",
			debug: true
		});
		break;
	case "sqlite":
		await xp.connect("Tests/test.db", {
			type: "sqlite",
			debug: true
		});
		break;
	}

	await xp.create("1234567890", "0987654321", "Abadima");

	await xp.create("1234567891", "0987654321", "Elizabeth");

	await xp.create("1234567892", "0987654321", "Jena");

	await xp.create("1234567893", "0987654321", "Rahul");

	await xp.create("1234567894", "0987654321", "Snowball");

	await xp.setLevel("1234567890", "0987654321", Infinity);

	await xp.setLevel("1234567891", "0987654321", 50);

	await xp.setLevel("1234567893", "0987654321", 420690000);

	await xp.setLevel("1234567892", "0987654321", 0);

	await xp.addXP("1234567892", "0987654321", 650);

	await xp.reset("1234567892", "0987654321").then(console.log);

	await xp.fetch("1234567892", "0987654321").then(console.log);

	await xp.rankCard(
		{id: "0987654321", name: "SimplyTests"},
		{
			avatarURL: "https://cdn.discordapp.com/avatars/326815959358898189/02ed1eef72af8eca955f35e309f8f3aa.webp",
			id: "1234567890", username: "Abadima"
		},
		{background: "https://img.freepik.com/free-vector/gradient-wavy-purple-background_23-2149117433.jpg"}
	).then(results => {
		require("fs").writeFileSync("Tests/rankcard.png", results.attachment);
	});

	await xp.leaderboard("0987654321").then(async (users) => {
		await xp.leaderboardCard(users, {
			// artworkImage: "https://th.bing.com/th/id/R.8cd8594560bd9cf4b042833a4acefaa5?rik=A6B1qYN%2b5GQAcA&riu=http%3a%2f%2fwallpaperswide.com%2fdownload%2fdesert_sky-wallpaper-2560x720.jpg&ehk=rE5VYZy8njd5ZeNT2p4sP7C5psjSf%2bxLZmV%2bvlQCffs%3d&risl=&pid=ImgRaw&r=0",
			backgroundImage: "https://static.vecteezy.com/system/resources/previews/000/962/809/original/abstract-gradient-background-with-colorful-and-modern-style-vector.jpg",
			light: false
		}, {
			name: "Development Hub",
			imageURL: "https://cdn.discordapp.com/icons/950190034852646912/5a800bf4caf28bfcaccc214446b461c4.webp",
			memberCount: 20
		}).then(results => {
			require("fs").writeFileSync("Tests/leaderboard.png", results.attachment);
		});
	});
}

test("mongodb");