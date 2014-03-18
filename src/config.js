
var path = require('path')
	, rootPath = path.normalize(__dirname + '/..')
	, mongo_user = process.env.MONGOLAB_USERNAME
	, mongo_password = process.env.MONGOLAB_PASSWORD
	, slogan = 'A Distributed Market Place'
	, domain = 'some.mongolab.com:port/some_url'
	;

/**
 * On the moment this code is meant to run with a local Mongo datbase, but it is easy to change it to one that you run
 * online, for example at mongolab.com. For that you will have to change to development, test, or production in the 
 * file index.js.
 */
module.exports = {
	local: {
		db: 'mongodb://localhost/dodedodo-dev',
		root: rootPath,
		app: {
			name: 'Dodedodo - ' + slogan
		},
	},
	development: {
		db: 'mongodb://' + mongo_user + ':' + mongo_password + '@domain',
		root: rootPath,
		app: {
			name: 'Dodedodo - ' + slogan
		},
	},
	test: {
		db: 'mongodb://' + mongo_user + ':' + mongo_password + '@domain',
		root: rootPath,
		app: {
			name: 'Dodedodo - ' + slogan
		},
	},
	production: {
		db: 'mongodb://' + mongo_user + ':' + mongo_password + '@domain',
		root: rootPath,
		app: {
			name: 'Dodedodo - ' + slogan
		},
	},
}
