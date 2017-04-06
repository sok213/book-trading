/*
* Some portions of code in this application are borrowed from 
* "The Complete NodeJS Course - 2" by Andrew Mead from Udemy.com
*/

const express  = require('express'),
_              = require('lodash'),
path           = require('path'),
mongoose       = require('mongoose'),
config         = require('./config'),
bodyParser     = require('body-parser'),
app            = express(),
{User}         = require('./models/user'),
{Trade}        = require('./models/trade'),
{authenticate} = require('./middleware/authenticate'),
{ObjectID}     = require('mongodb'),
{googleBooks}  = require('./controllers/apiController'),
port           = process.env.PORT || 3000,
db             = mongoose.connect(config.getDbConnectionString());

// Set views and view engine to HandleBars.
app.set('views', path.join(__dirname, 'views'));

// Set bodyParser module. 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Public route for home page.
app.get('/', (req, res) => {
  
  // Find all books posted by every user and send it back to client.
  User.find({}, ['-email', '-city', '-state'], (err, doc) => {
    res.send(doc);
  });
});

// Public route for sign up.
app.get('/signup', (req, res) => {
  res.send('Sign-up.');
});

// Private route for profile settings.
app.get('/users/settings', (req, res) => {
  res.send('Settings.');
});

// Private route for user profile.
app.get('/users/myprofile', authenticate, (req, res) => {
  res.send(req.user);
});

// Public route for 404 page.
app.get('*', (req, res) => {
  res.status(404).send('404.');
});

// POST /users for users to create a new account.
app.post('/users', (req, res) => {
  let body = _.pick(req.body, ['email', 'password', 'username']);  
  let user = new User(body);

  user.save().then(() => {
    return user.generateAuthToken();
  }).then((token) => {
    // Send back the user document after new user is saved.
    res.header('x-auth', token).send(user);
  }).catch((e) => {
    res.status(400).send(e);
  });
});

// POST /users/login to sign-in existing users.
app.post('/users/login', (req, res) => {
  let body = _.pick(req.body, ['email', 'password']);
  
  User.findByCredentials(body.email, body.password).then((user) => {
    return user.generateAuthToken().then((token) => {
      res.header('x-auth', token).send(user);
    });
  }).catch((e) => {
    res.status(400).send(e);
  });
});

// PATCH /users/myprofile/:id to update the user's name, city and state 
// properties.
app.patch('/users/myprofile/:id', authenticate,  (req, res) => {
  let id = req.params.id;
  let body = _.pick(req.body, ['city', 'state', 'name', 'bio']);
  
  if(!ObjectID.isValid(id)) {
    return res.status(404).send();
  }
  
  if(id !== req.user.id) {
    return status(401).send();
  }
  
  User.findByIdAndUpdate(id, { $set: body }, { new: true }).then((user) => {
    if(!user) {
      return res.status(404).send();
    }
    
    res.send(user);
  }).catch((e) => {
    res.status(400).send();
  });
});

// POST /users/myprofile/:id/books to add new books.
app.post('/users/myprofile/:id/books', authenticate, (req, res) => {
  let {bookTitle} = _.pick(req.body, ['bookTitle']);
  let id = req.params.id;
  
  googleBooks(bookTitle, (err, book) => {
    if(err) {
      return res.status(400).send();
    }
    
    let newBook = {
      title: book[0].volumeInfo.title,
      author: book[0].volumeInfo.authors.join(', '),
      thumbnail: book[0].volumeInfo.imageLinks.thumbnail
    };
    
    // Push in the new book into the user's book property array.
    User.findByIdAndUpdate(id, 
      { $push: {books: newBook} }, 
      { safe: true, upsert: true, new : true })
    .then((addedBook) => {
      if(!addedBook) {
        return res.status(404).send();
      }
      res.send(addedBook);
    });
  });
});

// GET /users/trade/:id/:userBook to allow the client to select a book
// from the their library and send it to the POST request which creates a 
// sent trade.
app.get('/users/trade/:id/:userBook', authenticate, (req, res) => {
  // Store the book object that the client wants to trade for and the id of
  // the receiving user.
  let userBook = req.params.selectedBook;
  let userId = req.params.id;
  
  // Render a view with the above parameter to be injected into a POST
  // request.
  
  // User will choose a book from their library. User's book and client book
  // will merge into a 'sentTrades' object for the user and a 'pendingTrades'
  // object for the receiving user.
});

// POST /users/propose-trade to propose a trade to another user.
app.post('/users/propose-trade', authenticate, (req, res) => {
  /*
  * Get client user doc and add book and send book object to client user's 
  * 'sentTrades' array property. Then, get other user doc and add book and
  * client user's 'name' and 'email' property too other user's 'pendingTrades'
  * array property.
  */
  
  let body = _.pick(req.body, ['userBook', 'userId', 'clientBook', 'clientId']);
  //res.send(req.user);
  // Create trade object.
  let trade = new Trade({
    sentBook: body.clientBook,
    askingBook: body.userBook,
    sentFrom: {
      _id: body.clientId,
      username: req.user.username
    },
    sentTo:{
      _id: body.userId,
      username: null
    }
  });
  
  // Set trade.sentTo.username property value.
  User.findById(body.userId, (err, user) => {
    trade.sentTo.username = user.username;
    // Save trade to trades collection.
    trade.save().then((resultTrade) => {
      
      // Find receiving user and add the 'pendingTrades' object.
      User.findByIdAndUpdate(body.userId, 
        { $push: { 'trades.pendingTrades': resultTrade } },
        { safe: true, upsert: true, new : true })
      .then((thisUser) => {
          if(!thisUser) {
            return res.status(400).send();
          }
      }).catch((e) => res.status(400).send(e));
      
      // Find client user and add the 'sentTrades' object.
      User.findByIdAndUpdate(body.clientId, 
        { $push: { 'trades.sentTrades': resultTrade } },
        { safe: true, upsert: true, new : true })
      .then((thisUser) => {
        if(!thisUser) {
          return res.status(400).send();
        }
      }).catch((e) => res.status(400).send(e));
      
      //res.send(resultTrade);
    }).catch((e) => {
      res.status(400).send(e);
    });
  });
  
  
  // Redirect to client's profile page.
  res.redirect('/users/myprofile');
});

// PATCH /users/myprofile/:id/accept to accept trade requests.
app.patch('/users/myprofile/:id/accept', authenticate, (req, res) => {
  /*
  * Get client user doc and move the trade request object to 'acceptedTrades'
  * property. Then, get other user doc and move trade bject from 'sentTrades'
  * to 'acceptedTrades' property.
  */
});

// DELETE /users/myprofile/token to delete the JWT token 
app.delete('/users/myprofile/token', authenticate, (req, res) => {
  req.user.removeToken(req.token).then(() => {
    res.status(200).send();
  }, () => {
    res.status(400).send();
  });
});

app.listen(port, () => console.log('Listening on PORT: ', port));
