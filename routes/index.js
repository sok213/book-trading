const express  = require('express'),
_              = require('lodash'),
{User}         = require('./../models/user');

// Retrieve Modules.
const router = express.Router();

// Public route for home page.
router.get('/', (req, res) => {
  // Find all books posted by every user and send it back to client.
  User.find({}, ['-email', '-city', '-state'], (err, doc) => {
    res.render('home', {
      books: doc
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

// Public route for 404 page.
router.get('*', (req, res) => {
  res.status(404).render('404', {
    error_msg: 'Page not found.'
  });
});

module.exports = router;