/*
* Some portions of code in this application are borrowed from 
* "The Complete NodeJS Course - 2" by Andrew Mead from Udemy.com
*/

const express = require('express'),
_             = require('lodash'),
path          = require('path'),
mongoose      = require('mongoose'),
config        = require('./config'),
bodyParser    = require('body-parser'),
app           = express(),
{User}        = require('./models/user'),
port          = process.env.PORT || 3000,
db            = mongoose.connect(config.getDbConnectionString());

// Set views and view engine to HandleBars.
app.set('views', path.join(__dirname, 'views'));

// Set bodyParser module. 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.send('Hello.');
});

// POST /users for users to create a new account.
app.post('/users', (req, res) => {
  let body = _.pick(req.body, ['email', 'password']);  
  let user = new User(body);
  
  user.save().then(() => {
    return user.generateAuthToken();
  }).then((token) => {
    res.header('x-auth', token).send(user);
  }).catch((e) => {
    res.status(400).send(e);
  });
  
});

app.listen(port, () => console.log('Listening on PORT: ', port));
