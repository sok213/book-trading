const mongoose = require('mongoose'),
validator      = require('validator'),
_              = require('lodash'),
config         = require('./../config'),
jwt            = require('jsonwebtoken'),
bcrypt         = require('bcryptjs');

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
  username: {
    type: String,
    required: true,
    minlength: 1,
    unique: true
  },
  name: {
    type: String,
    minlength: 1
  },
  city: {
    type: String,
    minlength: 1,
    default: 'Not specified.'
  },
  state: {
    type: String,
    minlength: 1,
    default: 'Not specified.'
  },
  bio: {
    type: String
  },
  books: {
    type: Array
  },
  trades: {
    type: Array
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
  
  return _.pick(userObject, 
    [
      '_id', 
      'email', 
      'city', 
      'state', 
      'books', 
      'username',
      'trades'
    ]);
};

UserSchema.methods.generateAuthToken = function() {
  let user = this,
  access   = 'auth';
  // Generate and set the token to user instance.
  let token = jwt.sign({
    _id: user._id.toHexString(), 
    access
  }, config.JWT_SECRET).toString();
  
  user.tokens.push({ access, token });
  
  // We return this save method so that app.js can chain on a promise.
  return user.save().then(() => {
    // Return token back to app.js so that we can grab the token via a 
    // then() callback and responding there.
    return token;
  });
};

UserSchema.statics.findByToken = function(token) {
  let User = this;
  let decoded;
  
  try {
    decoded = jwt.verify(token, config.JWT_SECRET);
  } catch(e) {
    return Promise.reject();
  }
  
  return User.findOne({
    _id: decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  });
  
};

UserSchema.pre('save', function(next) {
  let user = this;
  
  if(user.isModified('password')) {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

UserSchema.statics.findByCredentials = function(email, password) {
  let User = this;
  
  return User.findOne({ email }).then((user) => {
    if(!user) {
      return Promise.reject('No user found');
    }
    
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, res) => {
        if(res) {
          resolve(user);
        } else {
          reject('passwords do not match');
        }
      });
    });
  });
};

UserSchema.methods.removeToken = function(token) {
  let user = this;
  
  return user.update({
    $pull: {
      tokens: { token }
    }
  });
};

let User = mongoose.model('User', UserSchema);

module.exports = { User };
