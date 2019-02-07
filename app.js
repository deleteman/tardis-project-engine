const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const expressLogger = require('morgan');
const requireDir = require("require-dir");
const mongoose = require("mongoose")
const logger = require("./lib/logger")
const config = require("config")
const checkAPIKey = require("./lib/apikeyCheck")

const routes = requireDir("./routes")


const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(expressLogger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


//Middleware checking for validity of the API key sent
app.use(checkAPIKey)


//Auto include route files so we don't have to manually keep adding them
Object.keys(routes).forEach( (file) => {
	let cnt = routes[file]
	console.log("New route: ", file)
	app.use('/' + file, cnt)	
})


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


// error handler
app.use(function(err, req, res, next) {
  // render the error page
  if(typeof err === "string") {
    err = {
      status: 500,
      message: err
    }
  }
  res.status(err.status || 500);
  let errorObj = {
    error: true,
    msg: err.message,
    errCode: err.status || 500
  }
  if(err.trace) {
    errorObj.trace = err.trace
  }

  res.json(errorObj);
});

mongoose.set('debug', true)

//DB connection
mongoose.connect(config.get("mongoose.connection_string"), {useNewUrlParser: true})
const dbConn = mongoose.connection

dbConn.on('error', logger.error)
dbConn.once('open', () => {
	logger.info("DB connection ready!")
})




module.exports = app;
