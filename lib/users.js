'use strict';
var debug = require('debug')('tasksServer:lib:users');
var mongoose = require('mongoose'); 

var Q = require('q');
var promise = Q;
mongoose.Promise = Q.Promise;


module.exports.register = register;
module.exports.authenticate = authenticate;
module.exports.getUser = getUser;

var Users = mongoose.model('Users');

function register(userName, email, password) {
	debug('in lib users.js register function');
	return isUniqueUser(userName, email).then(addUser);
	
	function isUniqueUser(userName, email) {
		debug('in lib users.js isUniqueUser function');
		var returnPromise = promise.defer();
		
		promise.all([
			getUser(userName),
			getUserByEmail(email)
		]).then(function(results) {
				console.log(results[0]);
				console.log(results[1]);
				if (!results[0] && !results[1]) {
					returnPromise.resolve(true);
				}
				
				if (results[0]) {
					var message =  'user name already exists';
					returnPromise.reject(message);
				} 
				if (results[1]) {
						var message =  'Another user with the given email found';
						returnPromise.reject(message);
				}

			})
		.catch(function(error){debug('error in registering user');returnPromise.reject('error in registering user')});
		return returnPromise.promise;		
		

	}
	function addUser() {
		return Users.create({userName: userName, email: email, password: password});
	}

}

function authenticate(userName, password) {
	debug('in lib users.js authenticate function');
	var returnPromise = promise.defer();
	var getUserPromise = getUser(userName);
	debug('promise returned from getUser', getUserPromise);
	getUserPromise.then(
		function(user){
			debug('user returned from getUser ', user);
			if (user) {
				if (user[0].password === password) {
					debug('inside authenticate  - user found');
					returnPromise.resolve({userName : userName, userId: user[0]._id});
				}
				else {
					debug('inside authenticate  - user not found', user[0].password, password);
					returnPromise.reject('authentication failed');
				}
			}
		}, 
		function(error){
			returnPromise.reject('authentication failed');
		}
	).catch(function(error){
		debug('error returned from get user ', error);
		returnPromise.reject('authentication failed');
	});
	return returnPromise.promise;
}



function getUser(userName) {
	debug('in lib users.js getUser function', userName );
	return Users.find({userName: userName}).exec();
	
}

function getUserByEmail(email) {
	debug('in lib users.js getUserByEmail function', email);
	return Users.find({email: email}).exec();
	
}
