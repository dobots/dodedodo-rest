
/**
 * Module dependencies.

 * For now this only stores which modules are available for everybody. This does not contain any status information
 * on modules for a user.
 */

// http://ilee.co.uk/mongoose-documents-and-jsonstringify/

var mongoose = require('mongoose')
	, Schema = mongoose.Schema;

var PortSchema = new Schema({
	name: String,
	dir: String,
	type: String,
	middleware: String
})

var ModuleSchema = new Schema({
		name: String,
		git: String,
		type: String,
		category: String,
		description: String,
		long_description: String,
		img_url: String,
		enable: Boolean,
		supported_middleware: Array,
		supported_devices: Array,
		default_middleware: String, // not yet implemented
		android: {
			package: String,
			url:  String
		},
		ports: [ PortSchema ]
})

ModuleSchema.methods = {

	// check how to get in general a json object out of it
	getModule: function() {
		var mod = {};
		mod.name = this.name;
		mod.git = this.git;
		mod.type = this.type;
		mod.category = this.category;
		mod.description = this.description;
		mod.long_description = this.long_description;
		mod.img_url = this.img_url;
		mod.default_middleware = this.default_middleware;
		mod.android = {};
		mod.android.package = this.android.package;
		mod.android.url = this.android.url;
		mod.supported_devices = [];
		for (var i = 0; i < this.supported_devices.length; i++) {
			mod.supported_devices.push(this.supported_devices[i]);
		}
		mod.supported_middleware = [];
		for (var i = 0; i < this.supported_middleware.length; i++) {
			mod.supported_middleware.push(this.supported_middleware[i]);
		}
		mod.ports = [];
		for (var i = 0; i < this.ports.length; i++) {
			var port = {};
			port.name = this.ports[i].name;
			port.dir = this.ports[i].dir;
			port.type = this.ports[i].type;
			port.middleware = this.ports[i].middleware;
			mod.ports.push(port);
		}
		//console.log(mod);
		return mod;
	}

}

mongoose.model('Module', ModuleSchema)
