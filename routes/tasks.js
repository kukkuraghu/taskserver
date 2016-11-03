'use strict';
var debug = require('debug')('tasksServer:routes:tasks');
var express = require('express');
var router = express.Router();
var tasks = require('../lib/tasks');
var formatResponseAndSend = require('../lib/formatResponseAndSend');
var isAuthenticated = require('../lib/auth');

/* GET users listing. */
router.get('/getTask', isAuthenticated, function(req, res, next) {
	debug('inside router tasks GET getTask');
	res.set('Access-Control-Allow-Origin', '*');
	res.send('task returned');
});


/* Add a task */
router.post('/addTask', isAuthenticated, function(req, res, next) {
	debug('inside router POST addTask ');
	debug('task title : ', req.body.title);
	res.set('Access-Control-Allow-Origin', '*');
	var addTaskPromise = tasks.addTask(req.body.title, req.user.id);
	
	formatResponseAndSend(req, res, next, addTaskPromise, 'Task Created');
});

/* Add a task */
router.post('/addTaskWithDetail', isAuthenticated, function(req, res, next) {
	debug('inside router POST addTaskWithDetail ');
	debug('task details : ', req.body.taskDetail);
	res.set('Access-Control-Allow-Origin', '*');
	var addTaskWithDetailPromise = tasks.addTaskWithDetail(req.body.taskDetail, req.user.id);
	
	formatResponseAndSend(req, res, next, addTaskWithDetailPromise, 'Task Created');
});

/* Delete a task */
router.post('/deleteTask', isAuthenticated, function(req, res, next) {
	debug('inside router POST deleteTask ');
	debug('task id : ', req.body.taskId);
	
	var deleteTaskPromise = tasks.deleteTask(req.body.id, req.user.id);
	formatResponseAndSend(req, res, next, deleteTaskPromise, 'Task Deleted');
});

/* Delete  tasks */
router.post('/deleteTasks', isAuthenticated, function(req, res, next) {
	debug('inside router POST deleteTasks ');
	debug('task ids : ', req.body.taskIds);
	
	var deleteTasksPromise = tasks.deleteTasks(req.body.taskIds, req.user.id);
	formatResponseAndSend(req, res, next, deleteTasksPromise, 'Tasks Deleted');
});

/* Mark  a task  as completed*/
router.post('/markTaskComplete', isAuthenticated, function(req, res, next) {
	debug('inside router POST markTaskComplete ');
	debug('task id : ', req.body.taskId);
	
	var markTaskCompletePromise = tasks.markTaskComplete(req.body.taskId, req.user.id);
	formatResponseAndSend(req, res, next, markTaskCompletePromise, 'Task Marked Complete');
});

/* Mark  a task  as open*/
router.post('/markTaskOpen', isAuthenticated, function(req, res, next) {
	debug('inside router POST markTaskOpen ');
	debug('task id : ', req.body.taskId);
	
	var markTaskOpenPromise = tasks.markTaskOpen(req.body.taskId, req.user.id);
	formatResponseAndSend(req, res, next, markTaskOpenPromise, 'Task Marked Open');
});

/* get all tasks for a user*/
router.get('/getTasks', isAuthenticated, function(req, res, next) {
	debug('inside router GET getTasks ');
	//res.set('Access-Control-Allow-Origin', '*');
	//res.header('Access-Control-Allow-Credentials', '*');
	//res.header("Access-Control-Allow-Credentials", true);
	debug('user id is :' + req.user.id);
	var getTasksPromise = tasks.getTasks(req.user.id);
	formatResponseAndSend(req, res, next, getTasksPromise, 'tasks');
});

module.exports = router;
