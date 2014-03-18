/**
 * Server-side controller for everything around modules
 */

var xmpp = require('../xmpp-admin');
var xmppClient = xmpp.Client;

// get nameserver from environmental variable, the user is allowed to know this account
var nameserver_username = process.env.XMPP_NAMESERVER_USERNAME || 'hal9000@dobots.customers.luna.net';

var mongoose = require('mongoose')
	, User = mongoose.model('User')
	, Module = mongoose.model('Module')
	;

/**
 * Information about modules from the database.
 */
exports.database = function(req, res) {
	/**
	 * Get all modules
	 */
 	if (req.method === 'GET') {

		if (!req.session.authorized) {
			console.log('Not authorized (yet) to retrieve modules');
			res.send({ success: false, status: 'not authorized' });
			return;
		}

		//console.log('Retrieving modules for ' + req.session.username);

		User.findOne({username_raw: req.session.username}, function(err, user) {
			if (err) {
				console.log('Error in finding user');
				res.send({ success: false, status: 'error' });
				return;
			}
			if (!user) {
				console.log('User does not exists', req.session.username);
				res.send({ success: false, status: 'does not exist' });
				return;
			} 

			Module.find(function(err, db_modules) {
				if (err) {
					res.send({ success: false, status: 'modules not found in database' });
					console.log('Error in retrieving modules');
					return console.error(err);
				}
				if (!db_modules) {
					res.send({ success: false, status: 'modules not found in database' });
					return;
				}
				//console.log('Found ' + db_modules.length + ' module(s)');
				var obj_modules = [];
				// parse this stuff
				for (i = 0; i < db_modules.length; ++i) {
					// if not enabled, skip to next
					if (!db_modules[i].enable) continue;

					var mod = {};
					//console.log('Send module with name "' + db_modules[i].name + '" to the browser');
					mod.name = db_modules[i].name;
					mod.description = db_modules[i].description;
					mod.category = db_modules[i].category;
					mod.long_description = db_modules[i].long_description;
					mod.img_url = db_modules[i].img_url;
					mod.git = db_modules[i].git;
					mod.type = db_modules[i].type;
					mod.android = {};
					mod.android.package = db_modules[i].android.package;
					mod.android.url = db_modules[i].android.url;
					mod.supported_devices = [];
					for (j = 0; j < db_modules[i].supported_devices.length; ++j) {
						var device = db_modules[i].supported_devices[j];
						mod.supported_devices.push(device);
					}
					mod.supported_middleware = [];
					for (j = 0; j < db_modules[i].supported_middleware.length; ++j) {
						var middleware = db_modules[i].supported_middleware[j];
						mod.supported_middleware.push(middleware);
					}
					mod.ports = [];
					for (j = 0; j < db_modules[i].ports.length; ++j) {
						var port = {};
						port.name = db_modules[i].ports[j].name;
						port.dir = db_modules[i].ports[j].dir;
						port.type = db_modules[i].ports[j].type;
						port.middleware = db_modules[i].ports[j].middleware;
						mod.ports.push(port);
					}
					obj_modules.push(mod);
				}

				res.send({ success: true, modules: obj_modules });
			})
		})
	}
};


/**
 * Information on and for modules that is gonna be communicated to the XMPP server
 */
exports.list = function(req, res) {
	/**
	 * The route /nameserver/modules sends a command to the XMPP server to send an updated list of modules to the 
	 * website, which will be subsequently written in the local database to the server. At any later moment a 
	 * /database route can be used to inspect the results of these requests. 
	 */
	if (req.method === 'GET') {
		if (!req.session.authorized) {
			console.log('Not authorized (yet) to retrieve modules');
			res.send({ success: false, status: 'not authorized' });
		} else {
			console.log('Retrieving modules for ' + req.session.username);
			var command = 'list';
			var msg = 'AIM ' + req.session.jid + ' ' + command; 
			console.log('Send request "AIM ' + command + '" to ' + nameserver_username);
			xmppClient.send(new xmpp.Element('message',{to:nameserver_username,type:'chat'}).
				c('body').t(msg)
			);
			res.send({ success: true, status: 'Request to update modules in database sent to XMPP server'});
		}
	}
}

// deploy a module
exports.deploy = function(req, res) {
	if (req.method === 'POST') {
		var module = req.body.module;
		//console.log('Deploy ', module);
		if (!req.session.authorized) {
			console.log('Not authorized (yet) to execute schema');
			res.send({ success: false, status: 'not authorized' });
		} else {
			if (!module || !module.module_name || module.module_name === "") {
				console.log('Error, not proper module object: ' + module);
				console.log('Name is ' + module.module_name);
				res.send({ success: false, status: 'Module object expected' });
				return;
			}
			Module.findOne({name: module.module_name}, function(err, m) {
				if (err) {
					console.log('Error retrieving modules from database');
					res.send({ success: false });
				} else if (!m) {
					console.log('Module "' + module.module_name + '" does not exists in local database');
					res.send({ success: false, status: 'Module ' + module.module_name + ' does not exist in local database' });
				} else {
					var mod = m.getModule();
					var jid = req.session.jid;
					console.log('Deploy module ' + mod.name + ' for ' + jid);
					var full_jid = jid + '/' + module.resource;

					var command = 'deploy';
					var mod_str = JSON.stringify(mod, null, 2);
					var msg = 'AIM ' + full_jid + ' ' + command + ' ' + mod_str;
					console.log('Send message: ' + msg);
					xmppClient.send(new xmpp.Element('message',{to:nameserver_username,type:'chat'}).
						c('body').t(msg)
					);			
					res.send({ success: true });
				}
			});
		}
	}
}

exports.start = function(req, res) {
	if (req.method === 'POST') {
		var module = req.body.module;
		console.log('Start ', module);
		if (!req.session.authorized) {
			console.log('Not authorized (yet) to execute schema');
			res.send({ success: false, status: 'not authorized' });
		} else {
			if (!module || module.module_name === "") {
				res.send({ success: false, status: 'module or module.module_name is not defined' });
				return;
			}
			Module.findOne({name: module.module_name}, function(err, m) {
				if (err) {
					console.log('Error retrieving modules from database');
					res.send({ success: false });
				} else if (!m) {
					console.log('Module does not exists in local database');
					res.send({ success: false });
				} else {
					var jid = req.session.jid;
					var full_jid = jid + '/' + module.resource;
					console.log('Start module ' + module.module_name + ' for ' + jid);
					var full_jid = jid + '/' + module.resource;

					var command = 'start';
					var mod_str = module.module_name + ' ' + module.id;
					var msg = 'AIM ' + full_jid + ' ' + command + ' ' + mod_str;
					xmppClient.send(new xmpp.Element('message',{to:nameserver_username,type:'chat'}).
						c('body').t(msg)
					);			
					res.send({ success: true });
				}
			});
		}
	}
}

exports.stop = function(req, res) {
	if (req.method === 'POST') {
		var module = req.body.module;
		console.log('Start ', module);
		if (!req.session.authorized) {
			console.log('Not authorized (yet) to execute schema');
			res.send({ success: false });
		} else {
			if (!module || module.module_name === "") {
				res.send({ success: false });
				return;
			}
			Module.findOne({name: module.module_name}, function(err, m) {
				if (err) {
					console.log('Error retrieving modules from database');
					res.send({ success: false });
				} else if (!m) {
					console.log('Module does not exists in local database');
					res.send({ success: false });
				} else {
					var jid = req.session.jid;
					var full_jid = jid + '/' + module.resource;
					console.log('Start module ' + module.module_name + ' for ' + jid);
					var full_jid = jid + '/' + module.resource;

					var command = 'stop';
					var mod_str = module.module_name + ' ' + module.id;
					var msg = 'AIM ' + full_jid + ' ' + command + ' ' + mod_str;
					xmppClient.send(new xmpp.Element('message',{to:nameserver_username,type:'chat'}).
						c('body').t(msg)
					);			
					res.send({ success: true });
				}
			});
		}
	}
}

exports.connect = function(req, res) {
	if (req.method === 'POST') {
		var request = req.body;
		//console.log('Connect request', request);
		if (!req.session.authorized) {
			console.log('Not authorized (yet) to execute schema');
			res.send({ success: false });
		} else {
			if (!request) {
				console.log('No message body');
				res.send({ success: false });
				return;
			} 
			var connect = request.connect;
			if (!connect) {
				console.log('No connect defined');
				res.send({ success: false });
				return;				
			}

			if (connect.dest.fake_module) {
				if (connect.src.fake_module) {
					console.log("Weird, a connection between two fake modules, should not happen");
					res.send({ success: false });
					return;				
				} else {
					console.log('Weird, a fake module should never be a destination, swap for now, and continue');
					connect.dest = [connect.src, connect.src = connect.dest][0];
				}
			}

			// quick local check if the modules exist
			// disable this check for now...
/*			Module.findOne({name: connect.src.module}, function(err, m) {
			 	if (err) {
			 		console.log('Error retrieving modules from database');
			 		res.send({ success: false });
			 	} else if (!m) {
			 		console.log('Module does not exists in local database');
			 		res.send({ success: false });
			 	} else {
					Module.findOne({name: connect.dest.module}, function(err, m) {
						if (err) {
							console.log('Error retrieving modules from database');
							res.send({ success: false });
						} else if (!m) {
							console.log('Module does not exists in local database');
							res.send({ success: false });
						} else {*/
							var username = req.session.username;
							var domain = "dobots.customers.luna.net";
							console.log('Username: ', username);
							if (!username.endsWith(domain)) {
							 	username = username + "@" + domain;
							}
							if (connect.src.resource.indexOf("@") == -1) {
								connect.src.resource = username + '/' + connect.src.resource;
							} 
							if (connect.dest.resource.indexOf("@") == -1) {
								connect.dest.resource = username + '/' + connect.dest.resource;
							} 

							var command = 'connect';

							if (connect.src.fake_module) {
								var origin = 'hal9000' + '@' + domain + '/website';
								var body = origin + ' ' + connect.src.module + ' ' + connect.src.id + ' ' + connect.src.port + ' '
									+ connect.dest.resource + ' ' + connect.dest.module + ' ' + connect.dest.id + ' ' + connect.dest.port;

								var msg = 'AIM ' + connect.dest.resource + ' ' + command + ' ' + body;		
								xmppClient.send(new xmpp.Element('message',{to:nameserver_username,type:'chat'}).
									c('body').t(msg)
								);
							} else {
								var body = connect.src.resource + ' ' + connect.src.module + ' ' + connect.src.id + ' ' + connect.src.port + ' '
									+ connect.dest.resource + ' ' + connect.dest.module + ' ' + connect.dest.id + ' ' + connect.dest.port;

								if (connect.src.resource != connect.dest.resource) {
									var msg = 'AIM ' + connect.src.resource + ' ' + command + ' ' + body;		
									xmppClient.send(new xmpp.Element('message',{to:nameserver_username,type:'chat'}).
										c('body').t(msg)
									);			
								} 
								
								var msg = 'AIM ' + connect.dest.resource + ' ' + command + ' ' + body;		
								xmppClient.send(new xmpp.Element('message',{to:nameserver_username,type:'chat'}).
									c('body').t(msg)
								);		
							}	
							res.send({ success: true });
						/*}
					});
			 	}
			});*/
		}
	}
}

exports.init = function(req, res) {
	if (req.method === 'POST') {
		var request = req.body;
		//console.log('Init request', request);
		if (!req.session.authorized) {
			console.log('Not authorized (yet) to execute schema');
			res.send({ success: false });
		} else {
			if (!request) {
				console.log('No message body');
				res.send({ success: false });
				return;
			} 
			var connect = request.connect;
			if (!connect) {
				console.log('No connect defined');
				res.send({ success: false });
				return;				
			}

			if (connect.src.fake_module) {
				if (connect.dest.fake_module) {
					console.log('Should have at least one real module');
					res.send({ success: false });					
				}
			} else if (connect.dest.fake_module) {
				// swap dest and src
				connect.dest = [connect.src, connect.src = connect.dest][0];
			} else {
				console.log('Should have at least one fake module');
				res.send({ success: false });
			}

			// quick local check if the modules exist
			Module.findOne({name: connect.dest.module}, function(err, m) {
				if (err) {
					console.log('Error retrieving modules from database');
					res.send({ success: false });
				} else if (!m) {
					console.log('Module does not exists in local database');
					res.send({ success: false });
				} else {
					var username = req.session.username;
					var domain = "dobots.customers.luna.net";
					console.log('Username: ', username);
					 if (!username.endsWith(domain)) {
					 	username = username + "@" + domain;
					}
					if (connect.src.resource.indexOf("@") == -1) {
						connect.src.resource = username + '/' + connect.src.resource;
					} 
					if (connect.dest.resource.indexOf("@") == -1) {
						connect.dest.resource = username + '/' + connect.dest.resource;
					} 

					var command = 'data';
					var type = 'string';
					var body = type + ' ' + connect.dest.module + ' ' + connect.dest.id + ' ' + connect.dest.port + ' '
						+ connect.src.user_input;
					
					var msg = 'AIM ' + connect.dest.resource + ' ' + command + ' ' + body;		
					xmppClient.send(new xmpp.Element('message',{to:nameserver_username,type:'chat'}).
						c('body').t(msg)
					);
					res.send({ success: true });
			 	}
			});
		}
	}
}
