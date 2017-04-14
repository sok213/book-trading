const {User} = require('./../models/user');

// Middleware function.
let authenticate = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  }
  
  res.redirect('/users/register');
};

module.exports = { authenticate };