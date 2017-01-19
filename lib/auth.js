'use strict';
module.exports = isAuthenticated;
var debug = require('debug')('tasksServer:lib:auth');
var users = require('./users');
var bcrypt = require('bcrypt');

function isAuthenticated(req, res, next) {
	debug('inside lib auth.js  function isAuthenticated ');
    //debug(req.user.name, req.user.pass);
    if (!req.tokenDecoded) return next({ status: 401, message: 'valid login required' });
    debug('loginType from token : ', req.tokenDecoded.loginType);
    switch (req.tokenDecoded.loginType) {
        case 'fb'       :   getFbUserDetail(req.tokenDecoded.id);
                            break;
        case 'google'   :   getGoogleUserDetail(req.tokenDecoded.id);
                            break;
        case 'user'     :   getUserDetail(req.tokenDecoded.id);
                            break;
    }
/*
    if (!req.user.name) return next({ status: 401, message: 'valid login required' });
	var getUserPromise = users.getUser(req.user.name);
	getUserPromise.then(function(user){
		if (user) {
*/
			/*
			if (bcrypt.compare(req.user.pass, user.password)) {
			*/
/*
			if (req.user.pass === user.password) {
				req.user.id = user._id;
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
*/
    function getFbUserDetail(fbId) {
        debug('logged in using fb');
		if(!fbId) next({ status: 401, message: 'valid login required' });
        var getUserPromise = users.getUserByFbUserId(fbId);
        getUserPromise.then(function (user) {
			debug("inside getUserPromise resolution function, ", user);
            if (user) {
                req.user = { id: user._id };
                next();
            }
            else {
                next({ status: 401, message: 'valid login required' });
            }
        });
    }
    function getGoogleUserDetail(googleId) {
        debug('logged in using google');
        if (!googleId) next({ status: 401, message: 'valid login required' });
        var getUserPromise = users.getUserByGoogleUserId(googleId);
        getUserPromise.then(function (user) {
            debug("inside getUserPromise resolution function, ", user);
            if (user) {
                req.user = { id: user._id };
                next();
            }
            else {
                next({ status: 401, message: 'valid login required' });
            }
        });
    }
    function getUserDetail(id) {
        debug('loggedin using user data');
        var getUserPromise = users.getUserById(id);
        getUserPromise.then(function (user) {
            if (user) {
                req.user = { id : user._id };
                next();
            }
            else {
                next({ status: 401, message: 'valid login required' });
            }
        });
    }
 }