const express  = require('express'),
_              = require('lodash'),
{User}         = require('./../models/user'),
passport       = require('passport');

// Retrieve Modules.
const router = express.Router();

// Public route for home page.
router.get('/', (req, res) => {
  console.log(res.locals);
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

// POST /login to sign-in existing users.
router.post('/login', passport.authenticate('local', 
  { successRedirect: '/', 
    failureRedirect: '/login', 
    failureFlash: true
  }), 
  (req, res) => {
    res.redirect('/');
});

// router.post('/login', (req, res) => {
//   let body = _.pick(req.body, ['email', 'password']);
//   
//   User.findByCredentials(body.email, body.password).then((user) => {
//     router.locals.user = user;
//     return user.generateAuthToken().then((token) => {
//       res.header('x-auth', token).redirect('/');
//     });
//   }).catch((e) => {
//     res.status(400).render('404', {
//       error_msg: e
//     });
//   });
// });

// Public route for 404 page.
router.get('*', (req, res) => {
  res.status(404).render('404', {
    error_msg: 'Page not found.'
  });
});

module.exports = router;