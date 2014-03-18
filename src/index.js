// Configuration details of the dodedodo express server.
var express = require('express')
	, assets = require('connect-assets')
	, mongoStore = require('connect-mongo')(express)
	, cookie = require('cookie')
	, fs = require('fs')
	, mongoose = require('mongoose')
	;


// Global vars: http://www.hacksparrow.com/global-variables-in-node-js.html 
var server = require('./server').server;
var app = require('./server').app;

// -- Basic application initialization --
// Create app instance

var env = 'local'
	, config = require('./config')[env];

// Mongoose db connection
var db = mongoose.connect(config.db);

// Mongoose models
var models_path = __dirname + '/models'
fs.readdirSync(models_path).forEach(function (file) {
	require(models_path+'/'+file)
})

var xmppClient = require('./xmpp-admin').xmppClient;

// Define port
app.port = process.env.PORT || 5000;

// Set logging
app.use(express.logger());

// Use cookies and define one for the session id
app.use(express.cookieParser());
app.use(express.session({ 
		secret: 'some_secret_pw',
		store: new mongoStore({
				url: config.db
			, collection : 'sessions' 
			//, clear_interval: 3600 // every hour delete the cookies
		}),
		cookie: { 
				//secure: true, // if secure, there will be no connect.sid set in the cookie
				expires: new Date(Date.now() + 3600 * 1000), //setting cookie to not expire on session end
				maxAge: 3600 * 1000, // after an hour
				// this is the session id for express, socket.io does not know it, http://www.danielbaulig.de/socket-ioexpress
				// key: 'connect.sid' 
		}
}));

// -- View initialization --

// Add connect-assets, these are entities that require compilation
app.use(assets());

// Set static assets, these are entities that can be served as they are, no compilation required 
// (yes apparently css can be compiled)
app.use(express.static(process.cwd() + '/public'));

// Set View Engine.
app.set('view engine', 'jade');

app.locals.pretty = true;

// Body parser middleware parses JSON or XML bodies into `req.body` object
app.use(express.bodyParser());

//checks request.body for HTTP method overrides
app.use(express.methodOverride());

// -- Finalization --
// Initialize routes
routes = require('./routes');
routes(app);

// Export server
module.exports = server;
