/*
* Some portions of code in this application are borrowed from 
* "The Complete NodeJS Course - 2" by Andrew Mead from Udemy.com
*/

const express  = require('express'),
_              = require('lodash'),
path           = require('path'),
mongoose       = require('mongoose'),
config         = require('./config'),
bodyParser     = require('body-parser'),
app            = express(),
{User}         = require('./models/user'),
{authenticate} = require('./middleware/authenticate'),
{ObjectID}     = require('mongodb'),
{googleBooks}  = require('./controllers/apiController'),
port           = process.env.PORT || 3000,
db             = mongoose.connect(config.getDbConnectionString());

// Set views and view engine to HandleBars.
app.set('views', path.join(__dirname, 'views'));

// Set bodyParser module. 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Public route for home page.
app.get('/', (req, res) => {
  googleBooks('the hobbit', (err, book) => {
    res.send(book);
  });
  //res.send('Home.');
});

// Public route for sign up.
app.get('/signup', (req, res) => {
  res.send('Sign-up.');
});

// Private route for profile settings.
app.get('/users/settings', (req, res) => {
  res.send('Settings.');
});

// Private route for user profile.
app.get('/users/myprofile', authenticate, (req, res) => {
  res.send(req.user);
});

// Public route for 404 page.
app.get('*', (req, res) => {
  res.status(404).send('404.');
});

// POST /users for users to create a new account.
app.post('/users', (req, res) => {
  let body = _.pick(req.body, ['email', 'password']);  
  let user = new User(body);

  user.save().then(() => {
    return user.generateAuthToken();
  }).then((token) => {
    // Send back the user document after new user is saved.
    res.header('x-auth', token).send(user);
  }).catch((e) => {
    res.status(400).send(e);
  });
});

// POST /users/login to sign-in existing users.
app.post('/users/login', (req, res) => {
  let body = _.pick(req.body, ['email', 'password']);
  
  User.findByCredentials(body.email, body.password).then((user) => {
    return user.generateAuthToken().then((token) => {
      res.header('x-auth', token).send(user);
    });
  }).catch((e) => {
    res.status(400).send(e);
  });
});

// PATCH /users/:id to update the user's name, city and state properties.
app.patch('/users/:id', authenticate,  (req, res) => {
  let id = req.params.id;
  let body = _.pick(req.body, ['city', 'state', 'name', 'bio']);
  
  if(!ObjectID.isValid(id)) {
    return res.status(404).send();
  }
  
  if(id !== req.user.id) {
    return status(401).send();
  }
  
  User.findByIdAndUpdate(id, { $set: body }, { new: true }).then((user) => {
    if(!user) {
      return res.status(404).send();
    }
    
    res.send(user);
  }).catch((e) => {
    res.status(400).send();
  });
});

// DELETE /users/myprofile/token to delete the JWT token 
app.delete('/users/myprofile/token', authenticate, (req, res) => {
  req.user.removeToken(req.token).then(() => {
    res.status(200).send();
  }, () => {
    res.status(400).send();
  });
});

app.listen(port, () => console.log('Listening on PORT: ', port));
