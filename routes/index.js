const express  = require('express'),
_              = require('lodash'),
{User}         = require('./../models/user'),
{Trade}        = require('./../models/trade'),
{ObjectID}     = require('mongodb'),
mongoose       = require('mongoose'),
passport       = require('passport');

// Retrieve Modules.
const router = express.Router();

// Public route for home page.
router.get('/', (req, res) => {
  
  // Find all books posted by every user and send it back to client.
  User.find({}, ['-email', '-city', '-state'], (err, doc) => {
    // Store all books in allBooks array.
    let allBooks = doc.map((item) => {
      return item.books;
    });
    // Flatten the multi-dimensional array.
    allBooks = [].concat.apply([], allBooks);
    
    res.render('explore', {
      books: allBooks,
      helpers: {
        convertjson: function(context) {
          return JSON.stringify(context);
        } 
      }
    });
  });
});

// Public route to view a user's public profile page.
router.get('/public-profile/:id', (req, res) => {
  let userId = req.params.id;
  
  // Find user by id and disply details to page.
  User.findById(userId, (err, user) => {
    if(err || !user) {
      return res.status(400).render('404', {
        error_msg: 'User was not found in database!'
      });
    }
    
    // Render view with user.
    res.render('public-profile', {
      user,
      helpers: {
        convertjson: function(context) {
          return JSON.stringify(context);
        } 
      }
    });
  });
});

// Public route for sign up.
router.get('/login', (req, res) => {
  res.render('login');
});

// Public route for sign up.
router.get('/signup', (req, res) => {
  res.render('sign-up');
});

// POST /login to sign-in existing users.
router.post('/login', passport.authenticate('local', 
  { successRedirect: '/users/mybookshelf', 
    failureRedirect: '/login', 
    failureFlash: true
  }), 
  (req, res) => {
    res.redirect('/');
});

// Logout the user.
router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

module.exports = router;