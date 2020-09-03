const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mysql = require('mysql');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const imageRouter = require('./routes/images')

const app = express();

// DB
let config = {
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASS,
}

const dbSocketPath = process.env.DB_SOCKET_PATH || "/cloudsql";

if (process.env.CLOUD_SQL_CONNECTION_NAME) {
  config.socketPath = `${dbSocketPath}/${process.env.CLOUD_SQL_CONNECTION_NAME}`;
}

const db = mysql.createConnection(config);

// connect to DB
// db.connect((err) => {
//   if (err) {
//     throw err;
//   }
//   console.log('Connected to database');
// });
global.db = db;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
  req.db = db;
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/images', imageRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
