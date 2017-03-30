const mongoose = require('mongoose'),
validator      = require('validator'),
_              = require('lodash');
jwt            = require('jsonwebtoken');

let UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: '{VALUE} is not a valid email.'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 4
  },
  tokens: [{
    access: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: true
    }
  }]
});

// Override the toJSON default method to only send back the user id and email
// when a user object is converted back to a JSON value.
UserSchema.methods.toJSON = function() {
  let user = this,
  userObject = this.toObject();
  
  return _.pick(userObject, ['_id', 'email']);
};

UserSchema.methods.generateAuthToken = function() {
  let user = this,
  access   = 'auth';
  
  let token = jwt.sign({
    _id: user._id.toHexString(), 
    access
  }, 'abc123').toString();
  
  user.tokens.push({ access, token });
  
  // We return this save method so that app.js can chain on a promise.
  return user.save().then(() => {
    // Return token back to app.js so that we can grab the token via a 
    // then() callback and responding there.
    return token;
  });
};

let User = mongoose.model('User', UserSchema);

module.exports = {
  User
};
