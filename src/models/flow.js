
/**
 * Flow dependencies.

 * Flow information is not the same as just adding modules and connections. There is also position information required
 * and knowledge of which ports are actually connected to which other ports.
 */

// http://ilee.co.uk/mongoose-documents-and-jsonstringify/

var mongoose = require('mongoose')
	, Schema = mongoose.Schema;

var ModuleInFlowSchema = new Schema({
	name: String,
	id: Number,
	device: String,
	x: Number,
	y: Number
})

var ConnectionSchema = new Schema({
	src: {
		module: String,
		id: Number,
		port: String
	},
	dest: {
		module: String,
		id: Number,
		port: String
	}
})

var DeviceInFlowSchema = new Schema({
	name: String,
	type: String
})

var FlowSchema = new Schema({
		name: String,
		modules: [ ModuleInFlowSchema ],
		connections: [ ConnectionSchema ],
		devices: [ DeviceInFlowSchema ]
})

mongoose.model('Flow', FlowSchema)
