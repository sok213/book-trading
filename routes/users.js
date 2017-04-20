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
  
  // Declare empty array to hold trade IDs stored with the user.
  let tradeIds = [];
  // Retrieve all trade IDs from user object and push it to tradeIds. 
  res.locals.user.trades.map((tradeId) => {
    tradeIds.push(tradeId);
  });
  
  // Find all trade objects via tradeIds from above.
  Trade.find({_id: { $in: tradeIds}}, (err, array) => {
    if(err) {
      return res.status(400).send(err);
    }
  }).then((trades) => {
    // Declare empty arrays for different states of trades requests.
    let receivedRequests = [];
    let sentRequests = [];
    let declinedRequests = [];
    let acceptedRequests = [];
    
    // Push each trade to the array corresponding to their state.
    trades.filter((trade) => {
      if(trade.status == 'declined') {
        declinedRequests.push(trade);
      } else if(trade.status == 'accepted') {
        acceptedRequests.push(trade);
      } else if(trade.sentFrom.username == res.locals.user.username) {
        sentRequests.push(trade);
      } else if(trade.sentFrom.username !== res.locals.user.username) {
        receivedRequests.push(trade);
      }
    });
    
    // Render mybookshelf.handleBars with variables.
    res.render('mybookshelf', {
      receivedRequests,
      sentRequests,
      declinedRequests,
      acceptedRequests,
      myBooks: res.locals.user.books,
      helpers: {
        convertjson: function(context) {
          return JSON.stringify(context);
        } 
      }
    });
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
      return res.render('sign-up', {
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

// POST /users/settings/setname to update the user's first and last name.
router.post('/settings/setname', authenticate,  (req, res) => {
  let id = res.locals.user.id;
  let body = _.pick(req.body, ['firstName', 'lastName']);
  
  // Check if form was not left empty.
  req.checkBody('firstName', 'Must provide a first name.').notEmpty();
  req.checkBody('lastName', 'Must provide a last name.').notEmpty();
  
  let errors = req.validationErrors();
  
  if(errors) {
    return res.render('settings', { errors });
  }
  
  User.findByIdAndUpdate(id, 
    { $set: { fullName: body } }, 
    { new: true }).then((user) => {
    if(!user) {
      return res.status(404).send('No user found.');
    }
    
    req.flash('success_msg', 'You have successfully set your name.');
    res.redirect('/users/settings');
  }).catch((e) => {
    res.status(400).send();
  });
});

// POST /users/settings/setlocation to update user's city and state.
router.post('/settings/setlocation', authenticate, (req, res) => {
  let id = res.locals.user.id;
  let body = _.pick(req.body, ['city', 'state']);
  
  // Check if form was not left empty.
  req.checkBody('city', 'Must provide a city.').notEmpty();
  req.checkBody('state', 'Must provide a state.').notEmpty();
  
  let errors = req.validationErrors();
  
  if(errors) {
    return res.render('settings', { errors });
  }
  
  User.findByIdAndUpdate(id, 
    { $set: { city: body.city, state: body.state } }, 
    { new: true }).then((user) => {
    if(!user) {
      return res.status(404).send('No user found.');
    }
    
    req.flash('success_msg', 'You have successfully set your location.');
    res.redirect('/users/settings');
  }).catch((e) => {
    res.status(400).send();
  });
});

// POST /users/settings/setbio to update user's bio
router.post('/settings/setbio', authenticate, (req, res) => {
  let id = res.locals.user.id;
  let body = _.pick(req.body, ['bio']);
  
  // Check if form was not left empty.
  req.checkBody('bio', 'Unable to sumbit empty bio.').notEmpty();
  
  let errors = req.validationErrors();
  
  if(errors) {
    return res.render('settings', { errors });
  }
  
  User.findByIdAndUpdate(id, 
    { $set: { bio: body.bio } }, 
    { new: true }).then((user) => {
    if(!user) {
      return res.status(404).send('No user found.');
    }
    
    req.flash('success_msg', 'You have successfully set your bio.');
    res.redirect('/users/settings');
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
  
  // Push in the new book into the user's book property array.
  User.findByIdAndUpdate(res.locals.user.id, 
    { $pull: { books: { id: bookId }} }, 
    { safe: true, upsert: true, new : true })
  .then(() => {
    console.log('Removed: ', bookId);
  });
});

// Export the router methods.
module.exports = router;
