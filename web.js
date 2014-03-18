/**
 * Main entry into the dodedodo server.
 *
 * To build potentionally left out packages use the default "npm install". To run the thing
 * 
 * node web.js
 */
var port, server;

// Include the src dir, it should have an index.js
server = require('./src');

// get the PORT from the environment or use 5000
port = process.env.PORT || 5000;

// start the server
server.listen(port, function() {
	return console.log("The Dodedodo REST server is listening on " + port + "\nPress CTRL-C to stop the server.");
});
