const express  = require('express'),
_              = require('lodash'),
{User}         = require('./../models/user'),
passport       = require('passport');

// Retrieve Modules.
const router = express.Router();

// Set locals variables on router.
router.use((req, res, next) => {
  res.locals.convertjson = (context) => {
    return JSON.stringify(context).replace(/'|&/g, '');
  };
  next(); 
});

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
      books: allBooks
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