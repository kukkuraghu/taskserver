'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var UsersSchema = new Schema({
    userName    : {type: String, required: true, unique: true},
	email		: {type: String, required: true, unique: true},
    password    : {type: String, required: true}
});
module.exports = mongoose.model('Users', UsersSchema);