/**
 * Server-side controller for everything around devices
 *
 * TODO: come up with proper REST naming conventions
 */

var xmpp = require('../xmpp-admin');
var xmppClient = xmpp.Client;

// get nameserver from environmental variable, is no problem if user knows the existence of this account
var nameserver_username = process.env.XMPP_NAMESERVER_USERNAME || 'hal9000@dobots.customers.luna.net';

var mongoose = require('mongoose')
	, User = mongoose.model('User')
	, Devices = mongoose.model('Devices')
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
			res.send({ success: false });
			return;
		}

		User.findOne({username_lowercase: req.session.username.toLowerCase()}, function(err, user) {
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

			Devices.findOne({jid: req.session.jid}, function(err, dd) {
				if (err) {
					res.send({ success: false, status: 'devices not found for' + req.session.jid + ' in database' });
					console.log('Error in retrieving devices');
					return console.error(err);
				}
				if (!dd) {
					console.log('No retrieving devices object');
					res.send({ success: false, status: 'devices not found ' + req.session.jid + ' in database' });
					return;
				}
				//console.log('Found devices', dd);
				var obj_devices = [];
				var devices = dd.devices;
				// parse this stuff
				for (i = 0; i < devices.length; ++i) {
					if (!devices[i].available) continue;

					var dev = {};
					dev.name = devices[i].name;
					dev.type = devices[i].type;
					obj_devices.push(dev);
				}

				res.send({ success: true, devices: obj_devices });
			})
		})
	}
};


/**
 * Information on and for devices that is gonna be communicated to the XMPP server
 */
exports.list = function(req, res) {

	if (req.method === 'GET') {
		if (!req.session.authorized) {
			console.log('Not authorized (yet) to retrieve devices');
			res.send({ success: false });
		} else {
			var command = 'devices';
			var msg = 'AIM ' + req.session.jid + ' ' + command;
			console.log('Send message to XMPP server: ' + msg);
			xmppClient.send(new xmpp.Element('message',{to:nameserver_username,type:'chat'}).
				c('body').t(msg)
			);
			res.send({ success: true });
		}
	}
}

