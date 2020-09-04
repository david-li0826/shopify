const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const imageRouter = require('./routes/images')

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser({limit: '50mb'}));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());

// DB
const dbSocketAddr = process.env.SQL_HOST.split(":");
const dbSocketPath = process.env.DB_SOCKET_PATH || "/cloudsql";

let config;

if (process.env.SQL_HOST) {
  config = {
    user: process.env.SQL_USER,
    database: process.env.SQL_DATABASE,
    password: process.env.SQL_PASSWORD,
    host: dbSocketAddr[0],
    port: dbSocketAddr[1]
  }
} else {
  config = {
    user: process.env.SQL_USER,
    database: process.env.SQL_DATABASE,
    password: process.env.SQL_PASSWORD,
    socketPath: `${dbSocketPath}/${process.env.INSTANCE_CONNECTION_NAME}`
  }
}

let db = mysql.createConnection(config);
db.connect();
global.db = db;

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/images', imageRouter);

module.exports = app;
