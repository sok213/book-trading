// Default Modules.
const express  = require('express'),
mongoose       = require('mongoose'),
_              = require('lodash'),
{User}         = require('./../models/user'),
{Trade}        = require('./../models/trade'),
{authenticate} = require('./../middleware/authenticate'),
{ObjectID}     = require('mongodb'),
{googleBooks}  = require('./../controllers/apiController');

// Retrieve Modules.
const router = express.Router();

// Route for profile settings.
router.get('/settings', (req, res) => {
  res.render('settings');
});

// Route for user profile.
router.get('/mybookshelf', authenticate, (req, res) => {
  res.render('mybookshelf', {
    myBooks: res.locals.user.books,
    helpers: {
      convertjson: function(context) {
        return JSON.stringify(context);
      } 
    }
  });
});

// POST /users/register for users to create a new account.
router.post('/register', (req, res) => {
  let body = _.pick(req.body, ['email', 'password', 'username']);  
  let user = new User(body);
  
  // Checks if form was properly filled out (validation).
  req.checkBody('username', 'Name is required').notEmpty();
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('username', 'Username is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('password2', 'Passwords do not match')
    .equals(req.body.password);
  req.checkBody({
    'password': {
      isLength: {
        options: [{ min: 4 }],
        errorMessage: 'Password must be at least 4 characters long.'
      }
    }
  });
    
  // If form was incorrectly filled out, store the errors in 
  // variable errors.
  let errors = req.validationErrors();
  
  if(errors) {
    return res.render('sign-up', { errors });
  }
  
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
      
      // After new user is created and saved to database, show a success 
      // message via flash() method.
      req.flash('success_msg', 'You are registered and can now login.');
      
      // Send back the user document after new user is saved.
      res.redirect('/login');
    });
  });
});

// PATCH /users/profile/:id to update the user's name, city and state 
// properties.
router.patch('/profile/:id', authenticate,  (req, res) => {
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

// POST /users/mybookshelf/books to add new books.
router.post('/mybookshelf/books', authenticate, (req, res) => {
  let {bookTitle} = _.pick(req.body, ['bookTitle']);
  
  googleBooks(bookTitle, (err, book) => {
    if(err) {
      return res.status(400).send();
    }
    
    if(!book || !book[0] || !book[0].volumeInfo.title ||
      !book[0].volumeInfo.imageLinks.thumbnail || !book[0].volumeInfo.authors
    ) {
      req.flash('error_msg', 'Book title was not found in the database.');
      return res.redirect('/users/mybookshelf');
    }

    let newBook = {
      title: book[0].volumeInfo.title,
      author:  book[0].volumeInfo.authors.join(', '),
      thumbnail: book[0].volumeInfo.imageLinks.thumbnail,
      owner: res.locals.user.username,
      id: mongoose.Types.ObjectId()
    };
    
    // Push in the new book into the user's book property array.
    User.findByIdAndUpdate(res.locals.user.id, 
      { $push: {books: newBook} }, 
      { safe: true, upsert: true, new : true })
    .then((addedBook) => {
      if(!addedBook) {
        return res.status(404).send();
      }
      req.flash('success_msg', 
        'You have successfully added a book to your shelf.');
      res.redirect('/users/mybookshelf');
    });
  });
});

// POST /users/mybookshelf/books/remove to remove a book from user's library.
router.post('/mybookshelf/books/remove', authenticate, (req, res) => {
  let bookId = mongoose.Types.ObjectId(req.body.bookId);
  
  // Remove a book from the user's book property array.
  User.findByIdAndUpdate(res.locals.user.id, 
    { $pull: { books: { id: bookId }} }, 
    { safe: true, upsert: true, new : true }
  );
});

// Export the router methods.
module.exports = router;
