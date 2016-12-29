'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var UsersSchema = new Schema({
    userName    : {type: String, required: true, unique: true},
	email		: {type: String, required: true, unique: true},
    password    : {type: String, required: true},
	fbAccount 	: {
		fbUserId : {type: String,  unique: true},
		fbUserEmail : {type: String,  unique: true},
		fbUserName : {type: String},
		fbProfilePicture : {type: String}
	},
	googleAccount 	: {
		googleUserId : {type: String,  unique: true},
		googleUserEmail : {type: String,  unique: true},
		googleUserName : {type: String},
		googleProfilePicture : {type: String}
	}
});
module.exports = mongoose.model('Users', UsersSchema);