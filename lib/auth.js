'use strict';
module.exports = isAuthenticated;
var debug = require('debug')('tasksServer:lib:auth');
var users = require('./users');
var bcrypt = require('bcrypt');

function isAuthenticated(req, res, next) {
	debug('inside lib auth.js  function isAuthenticated ');
	debug(req.user.name, req.user.pass);
	if (!req.user.name) return next({status:401, message:'valid login required'});
	var getUserPromise = users.getUser(req.user.name);
	getUserPromise.then(function(user){
		if (user) {
			/*
			if (bcrypt.compare(req.user.pass, user.password)) {
			*/
			if (req.user.pass === user[0].password) {
				req.user.id = user[0]._id;
				next();
			}
			else {
				next({status:401, message:'valid login required'});
			}
		}
		else {
			next({status:401, message:'valid login required'});
		}
	});
};