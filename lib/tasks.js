'use strict';
var debug = require('debug')('tasksServer:lib:tasks');
var mongoose = require('mongoose'); 
var Q = require('q');
var promise = Q;
mongoose.Promise = Q.Promise;

module.exports.addTask = addTask;
module.exports.addTaskWithDetail = addTaskWithDetail;
module.exports.deleteTask = deleteTask;
module.exports.deleteTasks = deleteTasks;
module.exports.markTaskComplete = markTaskComplete;
module.exports.markTaskOpen = markTaskOpen;
module.exports.getTasks = getTasks;

var Tasks = mongoose.model('Tasks');

function addTask(taskTitle, userId) {
	debug('in lib tasks.js addTask function');
	debug('taskTitle : ' + taskTitle);
	return Tasks.create({title: taskTitle, status: 'open', userId: userId});
}

function addTaskWithDetail(taskDetail, userId) {
	debug('in lib tasks.js addTaskWithDetail function');
	debug('task Detail : ' + taskDetail);
	taskDetail.status  = taskDetail.status || 'open';
	return Tasks.create({title: taskDetail.title, status: taskDetail.status, userId: userId});
}

function deleteTask(taskId, userId) {
	debug('in lib tasks.js deleteTask function');
	debug('taskId : ' + taskId);
	var returnPromise = Q.defer();
	var removePromise = Tasks.remove({_id: taskId, userId: userId});
	removePromise.then(function(data){
		debug(data);
		if (data.result.n) {
			returnPromise.resolve(data);
		}
		else returnPromise.reject('Task not found');
	})
	.catch(function(){
		returnPromise.reject('Error in deleting Task');
	});
	return returnPromise.promise;
}

function deleteTasks(taskIds, userId) {
	debug('in lib tasks.js deleteTasks function');
	debug('taskIds : ' + taskIds);
	var returnPromise = Q.defer();
	var removePromise = Tasks.remove({_id: {$in : taskIds}, userId: userId});
	removePromise.then(function(data){
		debug(data);
		if (data.result.n) {
			returnPromise.resolve(JSON.parse(JSON.stringify(data)));
		}
		else returnPromise.reject('Tasks not found');
	})
	.catch(function(error){
		debug(error);
		returnPromise.reject('Error in deleting Tasks');
	});
	return returnPromise.promise;
}

function markTaskComplete(taskId, userId) {
	debug('in lib tasks.js markTaskComplete function');
	debug('taskId : ' + taskId);
	return updateTaskStatus(taskId, 'completed', userId);
}

function markTaskOpen(taskId, userId) {
	debug('in lib tasks.js markTaskOpen function');
	debug('taskId : ' + taskId);
	return updateTaskStatus(taskId, 'open', userId);
}

function updateTaskStatus(taskId, newStatus, userId) {
	var returnPromise = Q.defer();
	var removePromise = Tasks.update({_id: taskId, userId: userId}, {status:newStatus});
	removePromise.then(function(data){
		debug(data);
		if (data.n) {
			returnPromise.resolve(data);
		}
		else returnPromise.reject('Task not found');
	})
	.catch(function(){
		returnPromise.reject('Error in updating Task');
	});
	return returnPromise.promise;	
}

function getTasks(userId) {
	debug('in lib tasks.js getTasks function');
	debug('the user id is : ' + userId);
	return Tasks.find({userId: userId}).lean().exec();
}
