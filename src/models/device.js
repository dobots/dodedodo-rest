
var mongoose = require('mongoose')
	, Schema = mongoose.Schema

var DeviceSchema = new Schema({
	name: String
	, type: String
	, available: Boolean
});

// Perhaps it is better to call this UserStatus, so it can later on also be append with information on modules
var DevicesSchema = new Schema({
	jid: String // bare jid (without resource)
	, devices: [ DeviceSchema ]
});

mongoose.model('Devices', DevicesSchema)
