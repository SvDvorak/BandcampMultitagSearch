var BandcampApi = require("./bandcamp");
var Database = require("./database");
var CacheUpdater = require("./cache-updater");
var Recacher = require("./re-cacher");
var Seeder = require("./seeder");
var TimeProvider = require("./time-provider");
var Config = require("./config");
const { timeout } = require("./extensions");

var logFunction = function(text) { console.log(new Date().toISOString() + ": " + text) };
var config = new Config();
var bandcamp = new BandcampApi(logFunction);
var database = new Database();
var updater = new CacheUpdater(bandcamp, database, logFunction);
var recacher = new Recacher(database, updater, logFunction);
var seeder = new Seeder(bandcamp, timeout, logFunction);
var timeProvider = new TimeProvider();

startServer();

async function startServer() {
	try {
		await require("./server")
			.start(
				config,
				database,
				updater,
				recacher,
				seeder,
				timeProvider,
				logFunction);
		logFunction("Server listening on port " + config.port);
	}
	catch(error) {
		logFunction("Unable to start server because " + error);
		if(error.body)
			logFunction(JSON.stringify(error.body));
	}
}