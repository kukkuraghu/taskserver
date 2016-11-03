'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var TaskSchema = new Schema({
 	title	: {type : String, required : true},
    status  : {type : String, required : true},
	userId  : {type : String, required : true},
});
module.exports = mongoose.model('Tasks', TaskSchema);