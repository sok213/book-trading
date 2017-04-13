// Default Modules.
const express  = require('express'),
_              = require('lodash'),
{User}         = require('./../models/user'),
{Trade}        = require('./../models/trade'),
{authenticate} = require('./../middleware/authenticate'),
{ObjectID}     = require('mongodb'),
{googleBooks}  = require('./../controllers/apiController');

// Retrieve Modules.
const router = express.Router();

// Private route for profile settings.
router.get('/users/settings', (req, res) => {
  res.render('settings');
});

// Private route for user profile.
router.get('/users/myprofile', authenticate, (req, res) => {
  res.send(req.user);
});

// POST /users/register for users to create a new account.
router.post('/users/register', (req, res) => {
  let body = _.pick(req.body, ['email', 'password', 'username']);  
  let user = new User(body);
  
  // Checks if form was properly filled out (validation).
  req.checkBody('name', 'Name is required').notEmpty();
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('username', 'Username is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('password2', 'Passwords do not match')
    .equals(req.body.password);
    
  // If form was incorrectly filled out, store the errors in 
  // variable errors.
  let errors = req.validationErrors();
  
  // Check if user name already exists.
  User.find({username: body.username}, (err, result) => {
    if(err) throw err;
    if(result[0]) {
      return res.render('register', {
        errors: [{msg: 'Username already exists!'}]
      });
    }
  
    // Creates a new user instance.
    let user = new User(body);
    
    // Saves user.
    user.save().then(() => {
      return user.generateAuthToken();
    }).then((token) => {
      // Send back the user document after new user is saved.
      res.header('x-auth', token).redirect('/');
      
      // After new user is created and saved to database, show a success 
      // message via flash() method.
      
      //req.flash('success_msg', 'You are registered and can now login.');
      // redirect to login.handlebars.
    }).catch((e) => {
      res.status(400).render('404', {
        error_msg: e
      });
    });
  });
});

// POST /users/login to sign-in existing users.
router.post('/users/login', (req, res) => {
  let body = _.pick(req.body, ['email', 'password']);
  
  User.findByCredentials(body.email, body.password).then((user) => {
    router.locals.user = user;
    return user.generateAuthToken().then((token) => {
      res.header('x-auth', token).redirect('/');
    });
  }).catch((e) => {
    res.status(400).render('404', {
      error_msg: e
    });
  });
});

// PATCH /users/myprofile/:id to update the user's name, city and state 
// properties.
router.patch('/users/myprofile/:id', authenticate,  (req, res) => {
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

// POST /users/myprofile/:id/books to add new books.
router.post('/users/myprofile/:id/books', authenticate, (req, res) => {
  let {bookTitle} = _.pick(req.body, ['bookTitle']);
  let id = req.params.id;
  
  googleBooks(bookTitle, (err, book) => {
    if(err) {
      return res.status(400).send();
    }
    
    let newBook = {
      title: book[0].volumeInfo.title,
      author: book[0].volumeInfo.authors.join(', '),
      thumbnail: book[0].volumeInfo.imageLinks.thumbnail
    };
    
    // Push in the new book into the user's book property array.
    User.findByIdAndUpdate(id, 
      { $push: {books: newBook} }, 
      { safe: true, upsert: true, new : true })
    .then((addedBook) => {
      if(!addedBook) {
        return res.status(404).send();
      }
      res.send(addedBook);
    });
  });
});

// DELETE /users/myprofile/token to delete the JWT token for logout users.
router.delete('/users/myprofile/token', authenticate, (req, res) => {
  req.user.removeToken(req.token).then(() => {
    router.locals.user = null;
    res.status(200).redirect('/');
  }, (e) => {
    res.status(400).render('404', {
      error_msg: e
    });
  });
});

// Export the router methods.
module.exports = router;
