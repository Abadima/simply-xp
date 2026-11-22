const { MongoClient } = require("mongodb");

// How long calls made before connect() wait, as with mongoose's buffering.
const WAIT_FOR_CONNECT_MS = 10000;

let opening = null;
let connectedTo = null;
let database = null;
let announceConnected;
const connected = new Promise((resolve) => (announceConnected = resolve));

/** Opens the connection once; connecting again to the same URI shares it. */
function connect(uri) {
	if (opening) {
		if (uri !== connectedTo) throw new Error("[XP] Already connected to a different database.");
		return opening;
	}

	connectedTo = uri;
	opening = MongoClient.connect(uri).then((client) => client.db());
	opening.then(
		(db) => {
			database = db;
			announceConnected(db);
		},
		() => {
			opening = connectedTo = null;
		}
	);
	return opening;
}

function waitForConnect() {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(
			() => reject(new Error("[XP] Not connected. Call connect() first.")),
			WAIT_FOR_CONNECT_MS
		);
		connected.then((db) => {
			clearTimeout(timer);
			resolve(db);
		});
	});
}

async function collection(name) {
	return (database ?? (await waitForConnect())).collection(name);
}

module.exports = { connect, collection };
