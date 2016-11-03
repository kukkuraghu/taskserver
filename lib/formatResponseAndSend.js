'use strict';
var debug = require('debug')('tasksServer:lib:formatResponseAndSend');
module.exports = formatResponseAndSend;

function formatResponseAndSend(req, res, next, promise, message) {
	promise.then(success, failure).catch(function(error){
		console.log('something unexpected happened');
		console.log(error);
		console.log('report to Admin');
		console.log(typeof error);
		error.message = 'Something unexpected happened. Contact Admin';
		next(error);
		//res.sendStatus(500);
	});
	function success(data) {
		debug('inside router success helper function ');
		var response = formatResponse(1, message, data);
		res.status(200).json(response);
	}
	function failure(error) {
		debug('inside router failure helper function ', error);
		var response = formatResponse(0, error);
		res.status(200).json(response);
	}
}

function formatResponse(status, message, data) {
	return { 
		status: status,
		message: message,
		data: data
	};
}
