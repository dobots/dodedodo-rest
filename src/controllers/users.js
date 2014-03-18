/**
 * Routes that have to do with user management. All of these functions call methods through the XMPP middleware.
 * This means that the response is not immediate. The function returns true/false with respect to valid parameters,
 * not if the function actually executes correctly. You will sometimes need long polling for that. This is not the
 * ideal situation. So, you create a new user through exports.create(), this request is sent to the XMPP server,
 * which handles also a lot of other requests, hence this function immediately returns. Then, you will have to call
 * again from the client-side to see if your request was successful.

 * This file does have proper REST routes:
 *  - users/authentication    
         with POST (existing user trying to get authenticated), GET (is authenticated), DELETE (logging out)
 *  - users/management 
         with POST (create a new user), GET (does user exist), DELETE (remove user), PUT (change user details)
 *
 * Tip: probably known to you, but req.query provides info for GET methods, req.body provides info for POST requests.
 */

var xmpp = require('../xmpp-admin');
var xmppClient = xmpp.Client;

// get nameserver from environmental variable, is no problem if user knows this account
var nameserver_username = process.env.DODEDODO_USERNAME || 'hal9000@dobots.customers.luna.net';

var mongoose = require('mongoose')
	, User = mongoose.model('User')
	, Module = mongoose.model('Module')
	;

String.prototype.endsWith = function (s) {
	return this.length >= s.length && this.substr(this.length - s.length) == s;
}

/**
 * The route users/management
 *
 * A POST creates a new user in the database and registers him/her at the XMPP server.
 */
exports.management = function(req, res) {

	if (req.method === 'POST') {
		var infoUser = req.body; // POST info resides in the body
		if (!infoUser.name || !infoUser.password) {
			console.log('Register failed, because not all fields are known');
			res.send({ success: false });
		} else {
			console.log('Try registering ' + infoUser.name + ' (but bail out if the user already exists)');
			// if user already exists locally, bail out, we are not gonna create a user if we already know he/she exists
			User.findOne({username_lowercase: infoUser.name.toLowerCase()}, function(err, user) {
				if (err) {
					console.log('Error in finding user');
					res.send({ success: false, status: 'error' });
					return;
				}
				if (user) {
					console.log('User already exists', user);
					res.send({ success: false, status: 'exists' });
					return;
				} else {
					// later on check if username is alphanumeric
					console.log('Create new user');
					var new_user = new User();
					new_user.provider = 'local';
					new_user.username = infoUser.name;
					new_user.password = infoUser.password;
					if (infoUser.email) {
						new_user.email = infoUser.email;
					}
					if (infoUser.fullname) {
						new_user.fullname = infoUser.fullname;
					}
					if (infoUser.message_body) {
						new_user.personal_remark = infoUser.message_body;
					}
					// TODO: set to 'pending' and require information from XMPP server before actually making user 'active'
					new_user.status = 'active';
					new_user.save(function(err) {
						if(err) {
							console.log(err);
							res.send({ success: false });
							return;
					} else {
							console.log('New user ' + new_user.username_raw + " created.");
						}
					});

					// actually register new XMPP account
					console.log('Actually register ' + infoUser.name + ' at XMPP server');
					xmppClient.send(new xmpp.Element('iq',{type:'set',id:'reg1'}).
						c('query',{xmlns:'jabber:iq:register'}).
						c('username').t(infoUser.name).up().
						c('password').t(infoUser.password).up().
						c('password-verify').t(infoUser.password).up()
					);

					// also set session to authorized, so no new authentication route needs to be called
					req.session.authorized = true;
					req.session.username = new_user.username_raw;
					req.session.password = new_user.password;
					req.session.jid = new_user.jid;

					// apparently, there is no XMPP request to check if an account exists because of security reasons
					// there can only be an error coming back, a 409 error specifically
					// http://forum.ag-software.net/thread/147-there-is-any-method-avaliable-to-find-user-exists
					// this might also be the case if the same account is already logged in to a chat channel

					res.send({ success: true });
				}
			});
		}
	}
}

exports.authentication = function(req, res) {
	if (req.method === 'GET') {
		//console.log('Check authentication');
		if (req.session.authorized) {
			res.send({ success: true });
		} else {
			res.send({ success: false, status: 'not authorized' });
		}
	} else if (req.method === 'DELETE') {
		if (!req.session) {
			res.send({ success: true });
			return;
		}
		req.session.authorized = false;
		//console.log('Sign out for user ', res.session.username);
		res.send({ success: true });
	} else if (req.method === 'POST') {

		var infoUser = req.body; 
		// should actually be called infoUser.username, not name
		if (!infoUser.name || !infoUser.password) {
			console.log('Retrieving information failed, because the autentication fields are not known');
			console.log('Retrieving modules for ' + infoUser.name + ' password ' + infoUser.password);
			res.send({ success: false });
		} else {
			User.findOne({username_lowercase: infoUser.name.toLowerCase()}, function(err, user) {
				if (err) {
					console.log('Error in finding user');
					res.send({ success: false, status: 'error' });
					return;
				}
				if (!user) {
					console.log('User does not exists: ' + infoUser.name.toLowerCase());
					res.send({ success: false, status: 'does not exist' });
					return;
				} 
				if (!user.authenticate(infoUser.password)) {
					console.log('User could not be authenticated');
					res.send({ success: false, status: 'authentication fails' });
					return;
				} else {
					console.log('User ' + infoUser.name + ' properly authenticated');
					req.session.authorized = true;
					req.session.username = user.username_raw;
					req.session.password = user.password;
					req.session.jid = user.jid;
					res.cookie('username', infoUser.name);
					res.send({ success: true });
				}
			})
		}
	}
}
