'use strict';
var debug = require('debug')('tasksServer:connections');
var mongoose = require('mongoose'); 
var Q = require('q');
var promise = Q;
mongoose.Promise = Q.Promise;


var config = require( '../config' );
if (!config.mongoURI) {
    config.mongoURI = "mongodb://localhost:27017/tasksDb";
}

var options =  { server: { reconnectTries: Number.MAX_VALUE, reconnectInterval: 10000 } };
var dbConnectPromise = Q.defer();

mongoose.connect(config.mongoURI, options)
mongoose.connection.on('connected', function () {
	console.log('MongoDB connected');
	dbConnectPromise.resolve(true);
}); 

mongoose.connection.on('error',     function(error)  {
						console.log('MongoDB connection error');
						//console.log('Exiting the App. Please ensure mongod is running and restart the app');
						dbConnectPromise.reject(error);
						//process.exit(0);
});

mongoose.connection.on('disconnected', function(){
    console.log('MongoDB disconnected');
});
mongoose.connection.on('reconnected', function() {
    console.log('Reconnected to MongoDB');
});
mongoose.connection.on('close',     function()  {
	console.log('MongoDB connection closed');
});
// Close the Mongoose connection on Control+C 
process.on('SIGINT', function() {  
    mongoose.connection.close(function () {
        //console.log('Mongoose default connection disconnected');    
        process.exit(0);  
    }); 
});
require('../models/users'); 
require('../models/task');

module.exports = dbConnectPromise.promise;