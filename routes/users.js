'use strict';
var debug = require('debug')('tasksServer:routes:users');
var express = require('express');
var router = express.Router();
var users = require('../lib/users');
var formatResponseAndSend = require('../lib/formatResponseAndSend');

/* GET users listing. */
router.get('/getUser', function(req, res, next) {
  res.send('user name returned');
});

/* GET users listing. */
router.get('/getUserWithEmail', function(req, res, next) {
  res.send('username with the mentioned email returned');
});

/* Register User */
router.post('/registerUser', function(req, res, next) {
	debug('inside router POST registerUser ');
	debug('userName : ', req.body.userName);
	debug('email : ', req.body.email);
	debug('password : ', req.body.password);
	var userRegistrationPromise = users.register(req.body.userName, req.body.email, req.body.password);
	formatResponseAndSend(req, res, next, userRegistrationPromise, 'User Registered');
});

/*User login - using user name and password */
router.post('/authenticateUser', function(req, res, next) {
	debug('inside router POST authenticateUser ');
	debug('userName : ', req.body.userName);
	debug('password : ', req.body.password);
	var userAuthenticationPromise = users.authenticate(req.body.userName, req.body.password);
	formatResponseAndSend(req, res, next, userAuthenticationPromise, 'User Authenticated');
});

/*User authenticated through fb */
router.post('/fbAuthenticateUser', function(req, res, next) {
    debug('inside router POST fbAuthenticateUser ');
	debug('fb user Id : ', req.body.fbUserId);
    debug('fb User Name : ', req.body.fbUserName);
    debug('fb email : ', req.body.fbEmail);
    debug('fb profile picture : ', req.body.fbProfilePicture);
    var fbAuthenticatedPromise = users.fbAuthenticate(req.body.fbUserId, req.body.fbUserName, req.body.fbEmail, req.body.fbProfilePicture);
	formatResponseAndSend(req, res, next, fbAuthenticatedPromise, 'User Authenticated');
});
module.exports = router;
