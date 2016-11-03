'use strict';
var debug = require('debug')('tasksServer:routes:utils');
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/isOnline', function(req, res, next) {
	debug('inside router utils GET isOnline');
	res.set('Access-Control-Allow-Origin', '*');
	res.status(200).json({status: 1, message: 'it is online'});
});

module.exports = router;
