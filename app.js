'use strict';
var debug = require('debug')('tasksServer:app');
//require('./lib/connections'); 
var express = require('express');
var fs = require('fs');
var path = require('path');
var favicon = require('serve-favicon');
var jwt = require('jsonwebtoken');
var config = require('./config');
var FileStreamRotator = require('file-stream-rotator');
var logger = require('morgan');
var logDirectory = path.join(__dirname, 'log');
// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)
// create a rotating write stream
var accessLogStream = FileStreamRotator.getStream({
  date_format: 'YYYYMMDD',
  filename: path.join(logDirectory, 'log-%DATE%.log'),
  frequency: 'daily',
  verbose: false
});


var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var auth = require('basic-auth');
//var routes = require('./routes/index');
var utils = require('./routes/utils');
var users = require('./routes/users');
var tasks = require('./routes/tasks');

var app = express();
// setup the logger
app.use(logger('combined', {stream: accessLogStream}));
// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));
app.use( function( req, res, next ) {
    // check header for user information
	var user = auth(req);
	//if user credential is available save in req.user so that subsequent routes can use it.
	if (user) {
		req.user = user;
		debug(req.user);
	}
	next();//call the next route
} );
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cookieParser());

var env = process.env.NODE_ENV || 'development';
app.set('env', env);


//app.use(express.static(path.join(__dirname, 'public')));


app.use(function(req, res, next) {
	//debug('req.origin : ', req.headers.origin);
    debug('base url : ', req.baseUrl);
    debug('original url : ', req.originalUrl);
	if (req.headers.origin) {
		res.header('Access-Control-Allow-Origin', req.headers.origin);
	}
	if (req.method === 'OPTIONS') {
		debug('req.method : ', req.method);
		res.header('Access-Control-Allow-Methods', 'GET, POST');
        res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-access-token");
		res.header("Access-Control-Max-Age", 24*60*60);
		res.status(200).send();
	}
	else {
		next();
	}
});

app.use(function(req, res, next){
	// check header  for token
    var token = req.body.token || req.query.token || req.headers[ 'x-access-token' ];
    // decode token
    if (token) {
        // verifies secret and checks exp
        try {
            var tokenDecoded = jwt.verify(token, config.secret);
        }
        catch (error) {
            //token available, but failed to authenticate. send authorization required status.
            debug("error in decoding token. sending http status 401", error);
            return res.status(401).json({ status: 0, message: "authentication failed" });
        }
        req.tokenDecoded = tokenDecoded;
    }
    next();
});

//app.use('/', routes);
app.use('/utils', utils);
app.use('/users', users);
app.use('/tasks', tasks);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
debug('print env :', app.get('env'));
if (app.get('env') === 'development') {
	
  app.use(function(err, req, res, next) {
	debug('Inside development error handling');
	debug('error : ', err);
	res.status(err.status || 500).json(err);
    /*
	res.status(err.status || 500);
    res.send({
      message: err.message,
      error: err
    });
	*/
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	debug('Inside production error handling');
	debug('error : ', err);
  res.status(err.status || 500);
  res.send({
    message: err.message,
    error: {}
  });
});


module.exports = app;
