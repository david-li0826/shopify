const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');

const {Storage} = require('@google-cloud/storage');

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
const dbSocketPath = process.env.DB_SOCKET_PATH || "/cloudsql";

let config;

// when developing locally, use Google Cloud SQL public host to connect DB
if (process.env.SQL_HOST) {
  const dbSocketAddr = process.env.SQL_HOST.split(":");
  config = {
    user: process.env.SQL_USER,
    database: process.env.SQL_DATABASE,
    password: process.env.SQL_PASSWORD,
    host: dbSocketAddr[0],
    port: dbSocketAddr[1]
  }
}
// when deploying on App Engine, use unix socket to connect DB
else {
  config = {
    user: process.env.SQL_USER,
    database: process.env.SQL_DATABASE,
    password: process.env.SQL_PASSWORD,
    socketPath: `${dbSocketPath}/${process.env.INSTANCE_CONNECTION_NAME}`
  }
}

let db = mysql.createPool(config);
global.db = db;

// Instantiate a storage client for Google Cloud Storage
const storage = new Storage();
const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET);

global.bucket = bucket;

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/images', imageRouter);

module.exports = app;
