const mongoose = require('mongoose'),
validator      = require('validator'),
_              = require('lodash'),
config         = require('./../config'),
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
  fullname: {
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
  }
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

UserSchema.statics.getUserByEmail = function(email, callback) {
  let User = this;
  var query = { email: email };
  User.findOne(query, callback);
};

UserSchema.statics.comparePassword = function(candidatePassword, hash, callback) 
{
  let User = this;
  bcrypt.compare(candidatePassword, hash, (err, isMatch) => {
    if(err) throw error;
    callback(null, isMatch);
  });
};

UserSchema.statics.getUserById = function(id, callback) {
  let User = this;
  User.findById(id, callback);
};

let User = mongoose.model('User', UserSchema);

module.exports = { User };
