'use strict';
var debug = require('debug')('tasksServer:lib:users');
var mongoose = require('mongoose'); 
var jwt = require('jsonwebtoken');
var config = require( '../config' );

var Q = require('q');
var promise = Q;
mongoose.Promise = Q.Promise;


module.exports.register = register;
module.exports.authenticate = authenticate;
module.exports.getUser = getUser;
module.exports.getUserById = getUserById;
module.exports.fbAuthenticate = fbAuthenticate;
module.exports.googleAuthenticate = googleAuthenticate;
module.exports.getUserByFbUserId = getUserByFbUserId;
module.exports.getUserByGoogleUserId = getUserByGoogleUserId;

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
        var getUserbyFbUserEmailPromise = getUserByFbUserEmail(email);
        return getUserbyFbUserEmailPromise.then(fbUserExists);
        function fbUserExists(user) {
			if (user) {
				//there is already a fbUser with the email. Link the user to this document
				return linkUserToFb(user._id, userName, email, password);
			}
			else {
				//there is no fbUser with the email. Create a new user document
				return Users.create({userName: userName, email: email, password: password});
			}
        }
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
				if (user.password === password) {
                    debug('inside authenticate  - user found');
                    var tokenJson = { "loginType": "user", "id": user._id };
                    var token = jwt.sign(tokenJson, config.secret, { expiresIn: config.tokenExpiry }, returnFromJwtSign);
					//returnPromise.resolve({userName : userName, userId: user._id});
				}
				else {
					debug('inside authenticate  - user not found', user.password, password);
					returnPromise.reject('authentication failed');
				}
			}
			else {
				returnPromise.reject('authentication failed');
            }
            function returnFromJwtSign(error, token) {
                if (error) {
                    debug("error in signing the token");
                    returnPromise.reject("error in fb authentication");
                }
                else {
                    debug("successfully signed the token : ", token);
                    var userObject = user.toObject();
                    userObject.token = token;
                    returnPromise.resolve({ userName: userObject.userName, userId: userObject._id, token: userObject.token });
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

/**
** check whether the fb user already has a user document - using the fb email id.
** if the user has one, link the fb account to that document.
** check whether the fb user already has a user document - using the fb user id.
** if the user record is already there,  use that one.
** if there is no existing document for the user, create one
**/
function fbAuthenticate(fbUserId, fbUserName, fbEmail, fbProfilePicture) {
    debug('in lib users.js fbAuthenticate function');
	var returnPromise = promise.defer();
	var getUserByEmailPromise = getUserByEmail(fbEmail);
	getUserByEmailPromise.then(furtherProcessing, errorInAuthentication).catch(somethingWentWrong);
	function furtherProcessing(user) {
		if (user) {
			//already there is a user document which has the same email id as fb email.
			//link the fb account to that user document. 
			debug('fbauthenticate link test user id :', user._id);
            if (user.fbAccount.fbUserId !== fbUserId || user.fbAccount.fbUserName !== fbUserName || user.fbAccount.fbEmail !== fbEmail || user.fbAccount.fbProfilePicture !== fbProfilePicture) {
                var linkFbToUserPomise = linkFbToUser(user._id, fbUserId, fbUserName, fbEmail, fbProfilePicture);
                linkFbToUserPomise.then(fbLinkedToUser, errorInAuthentication).catch(somethingWentWrong)
            }
            else {
                var tokenJson = { "loginType": "fb", "id": user.fbAccount.fbUserId };
                var token = jwt.sign(tokenJson, config.secret, { expiresIn: config.tokenExpiry }, returnFromJwtSign);
            }
		}
		else {
			//there is no user record which has the same fb email.
			//May be an user registered with FB info - No user info available. Or a new user.
			var getUserByFbUserIdPromise = getUserByFbUserId(fbUserId);
			getUserByFbUserIdPromise.then(furtherProcessing1, errorInAuthentication).catch(somethingWentWrong);
        }
        function returnFromJwtSign(error, token) {
            if (error) {
                debug("error in signing the token");
                returnPromise.reject("error in fb authentication");
            }
            else {
                debug("successfully signed the token : ", token);
                var userObject = user.toObject();
                userObject.token = token;
                returnPromise.resolve(userObject);
            }
        }
	}
	function furtherProcessing1(user) {
		if (user) {
			//user record with given FB id is available 
			//check any attributes/fields are changed. If changed, update the user document
			if(user.fbAccount.fbUserName !== fbUserName || user.fbAccount.fbUserEmail !== fbEmail || user.fbAccount.fbProfilePicture !== fbProfilePicture ) {
				var updateFbUserPromise = updateFbUser(fbUserId, fbUserName, fbEmail, fbProfilePicture);
				updateFbUserPromise.then(fbUserUpdated, errorInAuthentication).catch(somethingWentWrong);
			}
			else {
				//user found with the fb id. Return the token
                var tokenJson = { "loginType": "fb", "id": user.fbUserId };
                var token = jwt.sign(tokenJson, config.secret, { expiresIn: config.tokenExpiry }, returnFromJwtSign);
			}
		}
		else {
			//There is no user document, with the given fb id.
			//Create a new user document with the given fb information.
			var createFbUserPromise = createFbUser(fbUserId, fbUserName, fbEmail, fbProfilePicture);
			createFbUserPromise.then(fbUserCreated, errorInAuthentication).catch(somethingWentWrong);
        }
        function returnFromJwtSign(error, token) {
            if (error) {
                debug("error in signing the token");
                returnPromise.reject("error in fb authentication");
            }
            else {
                debug("successfully signed the token : ", token);
                var userObject = user.toObject();
                userObject.token = token;
                returnPromise.resolve(userObject);
            }
        }
    }

	function errorInAuthentication() {	
		debug('error in fb authentication ', error);
		returnPromise.reject('authentication failed');
	}
	function somethingWentWrong(error) {
		console.log('Something went wrong');
		console.log(error);
	}	
	function fbLinkedToUser(user) {
		debug("user linked to fb account :, ", user);
		//add the token to the resolved data.
		
		var tokenJson = {"loginType" : "fb", "id" : user.fbAccount.fbUserId};
		var token = jwt.sign(tokenJson, config.secret, {expiresIn : config.tokenExpiry}, returnFromJwtSign);
		
		function returnFromJwtSign(error, token) {
			if (error) {
				debug("error in signing the token");
				returnPromise.reject("error in fb authentication");
			}
			else {
				debug("successfully signed the token : ", token);
				var userObject = user.toObject();
				userObject.token = token;
				returnPromise.resolve(userObject);
			}
		}
	}
	function fbUserUpdated(user) {
		debug("user fb information updated :, ", user);
		//add the token to the resolved data.
		
		var tokenJson = {"loginType" : "fb", "id" : user.fbUserId};
		var token = jwt.sign(tokenJson, config.secret, {expiresIn : config.tokenExpiry}, returnFromJwtSign);
		
		function returnFromJwtSign(error, token) {
			if (error) {
				debug("error in signing the token");
				returnPromise.reject("error in fb authentication");
			}
			else {
				debug("successfully signed the token : ", token);
				var userObject = user.toObject();
				userObject.token = token;
				returnPromise.resolve(userObject);
			}
		}	
	}
	function fbUserCreated(user) {
		debug("user fb information created :, ", user);
		//add the token to the resolved data.
		
		var tokenJson = {"loginType" : "fb", "id" : user.fbUserId};
		var token = jwt.sign(tokenJson, config.secret, {expiresIn : config.tokenExpiry}, returnFromJwtSign);
		
		function returnFromJwtSign(error, token) {
			if (error) {
				debug("error in signing the token");
				returnPromise.reject("error in fb authentication");
			}
			else {
				debug("successfully signed the token : ", token);
				var userObject = user.toObject();
				userObject.token = token;
				returnPromise.resolve(userObject);
			}
		}		
	}
	return returnPromise.promise;
}

/**
** check whether the google user already has a user document or fb document- using the google email id.
** if the user has one, link the fb account to that document.
** check whether the fb user already has a user document - using the fb user id.
** if the user record is already there,  use that one.
** if there is no existing document for the user, create one
**/
function googleAuthenticate(googleUserId, googleUserName, googleEmail, googleProfilePicture) {
    debug('in lib users.js googleAuthenticate function');
	var returnPromise = promise.defer();
	var getUserByGoogleUserIdPromise = getUserByGoogleUserId(googleUserId);
	getUserByGoogleUserIdPromise.then(furtherProcessing1, errorInAuthentication).catch(somethingWentWrong);
	
	function furtherProcessing1(user) {
		debug('in lib users.js googleAuthenticate furtherProcessing1 function', user);
		if (user) {
			//user record with given google id is available 
			//check any attributes/fields are changed. If changed, update the user document
			if(user.googleAccount.googleUserName !== googleUserName || user.googleAccount.googleUserEmail !== googleEmail || user.googleAccount.googleProfilePicture !== googleProfilePicture ) {
				var updateGoogleUserPromise = updateGoogleUser(googleUserId, googleUserName, googleEmail, googleProfilePicture);
				updateGoogleUserPromise.then(googleUserUpdated, errorInAuthentication).catch(somethingWentWrong);
			}
			else {
				//user found with the google id. Return the token
                var tokenJson = { "loginType": "google", "id": user.googleAccount.googleUserId };
				var tokenPromise = Q.nfcall(jwt.sign, tokenJson, config.secret, { expiresIn: config.tokenExpiry });
				processTokenPromise(tokenPromise, returnPromise);
			}
		}
		else {
			//There is no user document, with the given google id.
			//check whether there is a document with the google email as the user email or fb email.
			//if there is one, link the google account to that document
			debug('in lib users.js googleAuthenticate furtherProcessing1 before calling getUserFromUserEmailOrFbMail');
			var getUserFromUserEmailOrFbMailPromise = getUserFromUserEmailOrFbMail(googleEmail);
			getUserFromUserEmailOrFbMailPromise.then(linkOrCreateGoogleUser, somethingWentWrong);
        }
    }
	function linkOrCreateGoogleUser(user) {
		debug('in lib users.js googleAuthenticate furtherProcessing1 linkOrCreateGoogleUser function', user);
		if (user) {
			//already there is a user document which has the same email id or fbMailId as google email.
			//link the google account to that user document. 
			var linkGoogleToUserPomise = linkGoogleToUser(user[0]._id, googleUserId, googleUserName, googleEmail, googleProfilePicture);
			linkGoogleToUserPomise.then(googleLinkedToUser, errorInAuthentication).catch(somethingWentWrong)
		}
		else {
			//there is no user record which has the same google email.
			//create  a new user document with google info
			//Create a new user document with the given google information.
			var createGoogleUserPromise = createGoogleUser(googleUserId, googleUserName, googleEmail, googleProfilePicture);
			createGoogleUserPromise.then(googleUserCreated, errorInAuthentication).catch(somethingWentWrong);
        }
	}

	function errorInAuthentication() {	
		debug('error in fb authentication ', error);
		returnPromise.reject('authentication failed');
	}
	function somethingWentWrong(error) {
		console.log('Something went wrong');
		console.log(error);
	}	
	function googleLinkedToUser(user) {
		debug("user linked to google account :, ", user);
		//add the token to the resolved data.
		
		var tokenJson = {"loginType" : "google", "id" : user.googleAccount.googleUserId};
		var tokenPromise = Q.nfcall(jwt.sign, tokenJson, config.secret, { expiresIn: config.tokenExpiry });
		processTokenPromise(tokenPromise, returnPromise);
	}
	function googleUserUpdated(user) {
		debug("user google information updated :, ", user);
		//add the token to the resolved data.
		var tokenJson = {"loginType" : "google", "id" : user.googleAccount.googleUserId};
		var tokenPromise = Q.nfcall(jwt.sign, tokenJson, config.secret, { expiresIn: config.tokenExpiry });
		processTokenPromise(tokenPromise, returnPromise);
	}
	function googleUserCreated(user) {
		debug("user google information created :, ", user);
		//add the token to the resolved data.
		
		var tokenJson = {"loginType" : "google", "id" : user.googleUserId};
		var tokenPromise = Q.nfcall(jwt.sign, tokenJson, config.secret, { expiresIn: config.tokenExpiry });
		processTokenPromise(tokenPromise, returnPromise);
	}
	return returnPromise.promise;
}


function getUser(userName) {
	debug('in lib users.js getUser function', userName );
	return Users.findOne({userName: userName}).exec();
}

function getUserById(id) {
    debug('in lib users.js getUserById function', id);
    return Users.findById(id).exec();
}
function getUserByEmail(email) {
	debug('in lib users.js getUserByEmail function', email);
	return Users.findOne({email: email}).exec();
}

function getUserByFbUserId(fbId) {
    debug('in lib users.js getUserByFbUserId function', fbId);
    return Users.findOne({ 'fbAccount.fbUserId' : fbId }).exec();
}

function getUserByFbUserEmail(fbEmail) {
    debug('in lib users.js getUserByFbUserEmai function', fbEmail);
    return Users.findOne({'fbAccount.fbUserEmail': fbEmail}).exec();
}

function getUserByGoogleUserId(googleId) {
    debug('in lib users.js getUserByGoogleUserId function', googleId);
    return Users.findOne({ 'googleAccount.googleUserId' : googleId }).exec();
}

function getUserByGoogleUserEmail(googleEmail) {
    debug('in lib users.js getUserByGoogleUserEmail function', googleEmail);
    return Users.findOne({'googleAccount.googleUserEmail': googleEmail}).exec();
}


function linkFbToUser(documentId, fbUserId, fbUserName, fbUserEmail, fbProfilePicture) {
	return Users.findByIdAndUpdate(documentId, {$set: {fbAccount : {fbUserId: fbUserId, fbUserName :  fbUserName, fbUserEmail : fbUserEmail, fbProfilePicture : fbProfilePicture}}},{new:true}).exec();
}
function linkGoogleToUser(documentId, googleUserId, googleUserName, googleUserEmail, googleProfilePicture) {
	debug('in linkGoogleToUser ' + 'documentId :' + documentId);
	return Users.findByIdAndUpdate(documentId, {$set: {googleAccount : {googleUserId: googleUserId, googleUserName :  googleUserName, googleUserEmail : googleUserEmail, googleProfilePicture : googleProfilePicture}}},{new:true}).exec();
}
function linkUserToFb(documentId,  userName, userEmail, userPassword) {
    return Users.findByIdAndUpdate(documentId, {$set: {userName: userName, email: userEmail, password: userPassword}},{new:true}).exec();
}

function updateFbUser(fbUserId, fbUserName, fbUserEmail, fbProfilePicture) {
	return Users.findOneAndUpdate({fbUserId : fbUserId}, {$set: {fbAccount : {fbUserId: fbUserId, fbUserName :  fbUserName, fbUserEmail : fbUserEmail, fbProfilePicture : fbProfilePicture}}},{new:true}).exec();
}

function updateGoogleUser(googleUserId, googleUserName, googleUserEmail, googleProfilePicture) {
	return Users.findOneAndUpdate({'googleAccount.googleUserId' : googleUserId}, {$set: {googleAccount : {googleUserId: googleUserId, googleUserName :  googleUserName, googleUserEmail : googleUserEmail, googleProfilePicture : googleProfilePicture}}},{new:true}).exec();
}

function createFbUser(fbUserId, fbUserName, fbUserEmail, fbProfilePicture) {
	return Users.create({fbAccount : {fbUserId: fbUserId, fbUserName :  fbUserName, fbUserEmail : fbUserEmail, fbProfilePicture : fbProfilePicture}});
}

function createGoogleUser(googleUserId, googleUserName, googleUserEmail, googleProfilePicture) {
	return Users.create({googleAccount : {googleUserId: googleUserId, googleUserName :  googleUserName, googleUserEmail : googleUserEmail, googleProfilePicture : googleProfilePicture}});
}

function getUserFromUserEmailOrFbMail(email) {
	debug('in lib users.js getUserFromUserEmailOrFbMail function', email);
	return Users.find().or([{email : email}, {'fbAccount.fbUserEmail' : email}]).exec();
}
function processTokenPromise(tokenPromise, returnPromise) {
	debug('executing processTokenPromise');
	tokenPromise.then(function(token){
		debug("successfully signed the token : ", token);
		returnPromise.resolve({token:token});
	}).catch(function(error){
		debug("error in signing the token");
		returnPromise.reject("error in fb authentication");
	});
}