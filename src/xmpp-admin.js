/**
 * Have the XMPP client running at all times. Make it "visible" by setting its presence status. The XMPP client is 
 * running at all times and provides functionality for all users via an admin-like account. It is called from the
 * main express server (in index.js) and from one of the controllers (nameserver.js).
 */

var Client = require('node-xmpp-client')
	, ltx = require('ltx')
	;

var server = require('./server').server;

if (!process.env.NOSENDGRID) {
	var sendgrid = require('./sendgrid-init').sendgrid;
}

var mongoose = require('mongoose')
, User = mongoose.model('User')
, Module = mongoose.model('Module')
, Devices = mongoose.model('Devices')

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};


/**
 * On an XMPP error, send an email message to the admin team using Sendgrid. Afterwards, try to reconnect in 1 to 3 
 * seconds.
 */
var xmppError = function() {
	console.error("xmppClient error");

	if (!process.env.NOSENDGRID) {
		sendgrid.send({
			to: 'anne@dobots.nl',
			toname: 'dodedodo team',
			from: 'heroku@dobots.nl',
			fromname: 'heroku',
			subject: 'xmpp error',
			text: 'An error occured in the xmpp client.'
		}, function(err, response) {
			if(err) {
				console.log('Failure to send email');
			} else {
				console.log('Email successfully sent');
			}
		});
	}

	setTimeout(xmppConnect, Math.ceil(Math.random() * 2000) + 1000); // 1000 - 3000 ms
};

var saveModules = function(modules) {
	//console.log('Received payload', payload);
	//var modules = JSON.stringify(eval("(" + payload + ")")); // convert to json for websocket e.g.
	//console.log('Store ' + modules.length + ' modules: ', modules);
	if (modules.length > 500) {
		console.log('Error: more than 500 modules does not sound good. We bail out xmpp-admin.js');
		return;
	}

	for (i = 0; i < modules.length; ++i) {
		if (!modules[i].name) {
			console.log('Name is not defined, so move on');
			continue;
		}
		//console.log('Store module with name: ', modules[i].name);
		//Module.remove();

		// will use find() instead of findOne(), hence .limit(1) at the end
		// https://blog.serverdensity.com/checking-if-a-document-exists-mongodb-slow-findone-vs-find/
		// let's not do that, there are duplicates created all the time
		//Module.find({name: modules[i].name}, function(err, m) {
		Module.findOne({name: modules[i].name}, function(err, m) {
			var i = this;
			if (err) {
				console.log('Error retrieving modules from database');
				//} else if (m && m.length > 0) {
		} else if (m) {
			//console.log('Module already exists in local database: ' + m);
		} else {
			console.log('Add module to database: ' + modules[i].name);
			//console.log('Complete:', modules[i]);
			var module = new Module();
			module.name = modules[i].name;
			module.git = modules[i].git;
			module.type = modules[i].type;
			module.category = modules[i].category;
			module.description = modules[i].description;
			module.long_description = modules[i].long_description;
			module.img_url = modules[i].img_url;
			module.enable = modules[i].enable;
			module.android = {};
			module.android.package = modules[i].android.package;
			module.android.url = modules[i].android.url;
			if (modules[i].default_middleware) {
				module.default_middleware = modules[i].default_middleware;
			}
			module.supported_middleware = [];
			if (modules[i].supported_middleware) {
				for (j = 0; j < modules[i].supported_middleware.length; ++j) {
					var middleware = modules[i].supported_middleware[j];
					module.supported_middleware.push(middleware);
				}
			}
			module.supported_devices = [];
			if (modules[i].supported_devices) {
				for (j = 0; j < modules[i].supported_devices.length; ++j) {
					var device = modules[i].supported_devices[j];
					module.supported_devices.push(device);
				}
			}
			for (j = 0; j < modules[i].ports.length; ++j) {
				var port = {};
				port.name = String(modules[i].ports[j].name);
				port.dir = modules[i].ports[j].dir;
				port.type = modules[i].ports[j].type;
				port.middleware = modules[i].ports[j].middleware;
				module.ports.push({name:port.name, dir:port.dir, type:port.type, middleware:port.middleware});
			}
			//console.log('To save:', module);
			module.save(function(err) {
				if (err) return handleError(err);
			});					
		}
		}.bind(i)); //.limit(1); // "this" needs binding to "i" because the for loop over modules will be finished before async. Module.find returns
	}
	};

	var saveDevices = function(msg) {

		//console.log('Incoming message:', msg);
		if (!msg.jid) {
			console.log('Error: could not find jid field in json description of devices');
			return;
		}

		if (!msg.devices) {
			console.log('Error: could not find devices field in json description of devices');
			return;
		}

		if (msg.devices.length > 20) {
			console.log('Error: more than 20 devices does not sound good. We bail out xmpp-admin.js');
			return;
		}

		var devices = msg.devices;

		if (!msg.devices.length) {
			console.log('Error: no devices. We bail out xmpp-admin.js');
			return;
		}

		Devices.findOne({jid: msg.jid}, function(err, dd) {
			if (err) {
				console.log('Error saving devices to database');
			} else if (!dd) {
				console.log('Devices for ' + msg.jid + ' are not yet added to database');
				var dd = new Devices();
				dd.jid = msg.jid;
				if (!dd.devices) dd.devices = [];
				for (i = 0; i < devices.length; ++i) {
					var dev = {};
					if (!devices[i].name) {
						console.log('Name is not defined, so move on to next device');
						continue;
					}
					dev.name = devices[i].name;
					var j = dev.name.indexOf('_'); // can be android_foo or raspberrypi_foo
					if (j < 0) {
						dev.type = dev.name;
					} else {
						dev.type = dev.name.substring(0,j);
					}
					dev.available = devices[i].available;
					dd.devices.push({name:dev.name, type:dev.type, available:dev.available});
				}
				dd.save(function(err) {
					if (err) return handleError(err);
				});
			} else {
				//console.log('A few devices for ' + msg.jid + ' are already there');
				if (!dd.devices) dd.devices = [];
				for (i = 0; i < devices.length; ++i) {
					if (!devices[i].name) {
						console.log('Name is not defined, so move on to next device');
						continue;
					}

					// check if already there
					var already_registered = -1;
					for (var j = 0; j < dd.devices.length; ++j) {
						if (!dd.devices[j]) {
							console.log('Error! Device ' + j + ' does not seem to exist');
							continue;
						}
						if (dd.devices[j].name === devices[i].name) {
							already_registered = j;
							break;
						}
					}

					if (already_registered < 0) {
						var dev = {};
						dev.name = devices[i].name;
						var j = dev.name.indexOf('_'); // can be android_foo or raspberrypi_foo
						if (j < 0) {
							dev.type = dev.name;
						} else {
							dev.type = dev.name.substring(0,j);
						}
						dev.available = devices[i].available;
						dd.devices.push({name:dev.name, type:dev.type, available:dev.available});
						//console.log('Store', dev);
					} else {
						dd.devices[already_registered].available = devices[i].available;
						//console.log('Update ', dd.devices[already_registered]);
					}
				}
				dd.save(function(err) {
					if (err) return handleError(err);
				});
			}
		}) //.limit(1);
	};

	var saveUserStatus = function(user_status) {
		console.log('Save status of user', user_status);
		var name = user_status.name;
		if (!name) {
			console.log('The AIM user command should have a json field \'name\'')
				return; 
		}
		User.findOne({username_raw: name}, function(err, user) {
			if (err) {
				console.log('Error in finding user');
				return;
			}
			if (!user) {
				console.log('User does not exists', name);
				return;
			} else {
				if (user.status === 'banned') {
					console.log('User ' + name + ' is banned');
					return;
				} else {
					console.log('Make user ' + name + ' active');
					user.status = 'active';
				}
			}
		})
	};

	/**
	 * Connect to the XMPP server (the Dodedodo nameserver). This uses local environmental variables to log into that 
	 * server. 
	 */
	var xmppConnect = function() {
		var jid_username = process.env.DODEDODO_USERNAME;
		var jid_password = process.env.DODEDODO_PASSWORD;
		var xmpp_server = process.env.XMPP_SERVER;
		var xmpp_port = process.env.XMPP_PORT;
		if (!jid_username) {
			console.log("Error: environmental variable DODEDODO_USERNAME is not defined");
			return;
		}
		if (jid_username.indexOf('@') == -1) {
			jid_username = jid_username + "@dobots.customers.luna.net";
		}
		console.log("Start XMPP client with username: " + jid_username);
		xmppClient = new Client({jid:jid_username,password:jid_password,
			host:xmpp_server,port:xmpp_port,reconnect:false});

		xmppClient.on('online', function() {
			console.log("xmpp client is online");
			xmppClient.send(new ltx.Element('presence',{type:'chat'}).
				c('show').t('chat').up().
				c('status').t('Dodedodo running...')
				);
		});

		xmppClient.on('stanza', function(stanza) {
			if (stanza.is('message')) {
				if (stanza.attrs.type == 'error') {
					console.log(stanza);
				} else {
					// handle incoming message and update e.g. the modules
					var body = stanza.getChild('body');
					if (!body) return;
					console.log("incoming message: <" + stanza.attrs.to + "> " + stanza.getChildText('body'));

					var message = body.getText();
					var ref = message.split(' ',2), protocol = ref[0], opcode = ref[1];

					if (!(protocol === 'AIM')) {
						console.log('Got message that does not start with AIM');
						return;
					}

					var payload = message.split(' ').slice(2).join(' ');
					console.log('Payload is:', payload);
					if (opcode === 'list_result') {
						var str = JSON.stringify(eval('(' + payload + ')')); // convert to json for websocket e.g.
						var json_modules = JSON.parse(str);
						saveModules(json_modules);
					} else if (opcode === 'user') {
						var str = JSON.stringify(eval("(" + payload + ")"));
						var json_userstatus = JSON.parse(str);
						saveUserStatus(json_userstatus);
					} else if (opcode === 'devices_result') {
						var str = JSON.stringify(eval('(' + payload + ')')); 
						var json_devices = JSON.parse(str);
						saveDevices(json_devices);
					}
				}
			}
		});

		xmppClient.on('close', function() {
			console.log("xmppClient closed, try to connect again later");
			setTimeout(xmppConnect, Math.ceil(Math.random() * 2000) + 1000); // 1000 - 3000 ms
		});

		xmppClient.on('end', function() {
			console.log("xmppClient ended");
		});

		xmppClient.on('error', function(msg) {
			console.log('Error, probably the XMPP server on ' + xmpp_server + ' could not be reached');
		});
	}

	xmppConnect();

	exports.Client = xmppClient;
	exports.Element = ltx.Element;

