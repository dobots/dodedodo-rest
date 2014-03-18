
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
	, Schema = mongoose.Schema
	, crypto = require('crypto')
	, _ = require('underscore')
	, authTypes = ['github', 'twitter', 'facebook', 'google', 'sense']

/**
 * User Schema
 */

var UserSchema = new Schema({
	name: String,
	fullname: String,
	email_raw: String,
	email_lowercase: String,
	username_raw: String,
	username_lowercase: String,
	jid: String,
	provider: String,
	hashed_password: String,
	salt: String,
	status: String, // 'pending', 'active', 'banned'
	personal_remark: String,
	facebook: {},
	twitter: {},
	github: {},
	google: {},
	twitter: {}
})

/**
 * Virtuals, those are not actual fields, but virtual fields and what is actually set are different fields, so for
 * example on setting the password field, actually the hashed_password field is set, together with a salt.
 */

UserSchema
	.virtual('password')
	.set(function(password) {
		this._password = password
		this.salt = this.makeSalt()
		this.hashed_password = this.encryptPassword(password)
	})
	.get(function() { return this._password })

UserSchema
	.virtual('username')
	.set(function(value) {
		var i = value.indexOf('@');
		if (i != -1) {
			this.jid = value.toLowerCase();
			//value = value.substring(1,i); do not adjust choice of user
		} else {
			this.jid = value.toLowerCase() + '@dobots.customers.luna.net'; // append with default domain for jid
		}
		this.username_raw = value
		this.username_lowercase = value && value.toLowerCase()
	})
	.get(function() { return this.username_raw })

UserSchema
	.virtual('email')
	.set(function(value) {
		this.email_raw = value
		this.email_lowercase = value && value.toLowerCase()
	})
	.get(function() { return this.email_raw })

/**
 * Validations
 */

var validatePresenceOf = function (value) {
	return value && value.length
}

// the below 4 validations only apply if you are signing up traditionally

UserSchema.path('name').validate(function (name) {
	// if you are authenticating by any of the oauth strategies, don't validate
	if (authTypes.indexOf(this.provider) !== -1) return true
	return name.length
}, 'Name cannot be blank')

UserSchema.path('email_raw')
.validate(function (email) {
	// if you are authenticating by any of the oauth strategies, don't validate
	if (authTypes.indexOf(this.provider) !== -1) return true
	return email.length
	// check if email already exists in database
}, 'Email address cannot be blank')
.validate(function (email) {
		if (authTypes.indexOf(this.provider) !== -1) return true
		return true; //validator.check(email).isEmail()
}, 'Invalidly formed email address')
.validate(function (email, next) {
		if (authTypes.indexOf(this.provider) !== -1) return true
		User = mongoose.model('User')
		// can you extend find() with 'provider': this.provider 
		User.find({ 'email': email.toLowerCase() }, function (err, user) { 
			next(err || user.length === 0)
		})
}, 'This email address is already registered, please login.')

UserSchema.path('username_raw').validate(function (username) {
	// if you are authenticating by any of the oauth strategies, don't validate
	if (authTypes.indexOf(this.provider) !== -1) return true
	return username.length
}, 'Username cannot be blank')
.validate(function (username, next) {
		if (authTypes.indexOf(this.provider) !== -1) return true
		User = mongoose.model('User')
		User.find({ 'username_lowercase': username.toLowerCase() }, function (err, user) {
			next(err || user.length === 0)
		})
}, 'Username already taken, please pick another one.')

UserSchema.path('hashed_password').validate(function (hashed_password) {
	// if you are authenticating by any of the oauth strategies, don't validate
	if (authTypes.indexOf(this.provider) !== -1) return true
	return hashed_password.length
}, 'Password cannot be blank')


/**
 * Pre-save hook
 */

UserSchema.pre('save', function(next) {
	if (!this.isNew) return next()

	if (!validatePresenceOf(this.password)
		&& authTypes.indexOf(this.provider) === -1)
		next(new Error('Sorry, invalid password'))
	else
		next()
})

/**
 * Methods
 */

UserSchema.methods = {

	/**
	 * Authenticate - check if the passwords are the same
	 *
	 * @param {String} plainText
	 * @return {Boolean}
	 * @api public
	 */

	authenticate: function(plainText) {
		return this.encryptPassword(plainText) === this.hashed_password
	},

	/**
	 * Make salt
	 *
	 * @return {String}
	 * @api public
	 */

	makeSalt: function() {
		return Math.round((new Date().valueOf() * Math.random())) + ''
	},

	/**
	 * Encrypt password
	 *
	 * @param {String} password
	 * @return {String}
	 * @api public
	 */

	encryptPassword: function(password) {
		if (!password) return ''
		console.log(this.salt);
		return crypto.createHmac('sha1', this.salt).update(password).digest('hex')
	}
}

mongoose.model('User', UserSchema)
