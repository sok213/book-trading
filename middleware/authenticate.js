const {User} = require('./../models/user');

// Middleware function.
let authenticate = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  }
  
  res.redirect('/signup');
};

let authenticateTrade = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  }
  
  res.render('sign-up', {
    error: 'Sign-up to start proposing trades with other users.'
  });
};

module.exports = { authenticate, authenticateTrade };