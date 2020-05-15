/* eslint-disable no-console */
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userRoutes = require('./routes/user');
const reportRoutes = require('./routes/report');
const responeUnitRoutes = require('./routes/responseUnit');

dotenv.config();

const app = express();

mongoose
  .connect('mongodb+srv://ersAdmin:Admin123@@ers-m0o8p.mongodb.net/ers?retryWrites=true&w=majority',
    {
      useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true
    })
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas!');
  }).catch((error) => {
    console.log('Unable to connect to MongoDB Atlas!');
    console.error(error);
  });

app.use(cors());
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-Width, Content, Accept, Content-Type, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

app.use((req, res, next) => {
  if (!req.body) {
    res.status(404).send('Resource not found.');
  } else {
    next();
  }
});

app.use('/api/auth', userRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/response-unit', responeUnitRoutes);

app.use((req, res, err) => {
  if (res.headersSent) {
    return;
  }

  res.status(err.status || 500);
  res.send(err.message || 'Internal Server Error');
});

module.exports = app;
