// Default Modules.
const express       = require('express'),
_                   = require('lodash'),
mongoose            = require('mongoose'),
app                 = express(),
{User}              = require('./../models/user'),
{Trade}             = require('./../models/trade'),
{authenticate}      = require('./../middleware/authenticate'),
{authenticateTrade} = require('./../middleware/authenticate');

// Retrieve Modules.
const router = express.Router();

router.use((req, res, next) => {
  res.locals.selectedBook = req.selectedBook || null;
  next();
});

// GET /users/trade/propose-trade/create to allow the client to select a book
// from the their library and send it to the POST request which creates a 
// sent trade.
router.post('/propose-trade/create', authenticateTrade, (req, res) => {
  
  // Prevent user from proposing a trade with themselves.
  if(res.locals.user.username == JSON.parse(req.body.selectedBookOwner)) {
    return res.render('trade-error', {
      error_msg: 'You cannot trade a book with yourself!'
    });
  }
  
  // Store the book object that the client wants to trade for and the id of
  // the receiving user.
  let selectedBook = req.body.selectedBook;
  let userId = res.locals.user.id;
  
  // Find the selected book via Id and send the object to 
  // create-trade.handlebars.
  User.findOne({'books.id': mongoose.Types.ObjectId(JSON.parse(selectedBook))}, 
    {'books.$': 1}, (err, doc) => {
    if(err) {
      return res.status(400).render('404', { error: err });
    }
    app.locals.selectedBook = doc.books[0];
    res.render('create-trade', {
      selectedBook: doc.books[0],
      myBooks: res.locals.user.books,
      helpers: {
        convertjson: function(context) {
          return JSON.stringify(context);
        } 
      }
    });
  });
});

// POST /users/propose-trade to propose a trade to another user.
router.post('/propose-trade/send', authenticate, (req, res) => {
  
  //Create trade object.
  let trade = new Trade({
    sentBook: JSON.parse(req.body.sentBook),
    askingBook: app.locals.selectedBook,
    sentFrom: {
      username: res.locals.user.username
    },
    sentTo:{
      username: app.locals.selectedBook.owner
    }
  });
  
  // Save trade to trades collection.
  trade.save().then((resultTrade) => {
    
    // Find receiving user and add the 'pendingTrades' object.
    User.findOneAndUpdate({ username: app.locals.selectedBook.owner }, 
      { $push: { trades: resultTrade._id } },
      { safe: true, upsert: true, new : true })
    .then((thisUser) => {
        if(!thisUser) {
          return res.status(400).send();
        }
    })
    .catch((e) => res.status(400).send(e));
    
    // Find client user and add the 'sentTrades' object.
    User.findByIdAndUpdate(res.locals.user._id, 
      { $push: { trades: resultTrade._id } },
      { safe: true, upsert: true, new : true })
    .then((thisUser) => {
      if(!thisUser) {
        return res.status(400).send();
      }
      res.redirect('/users/mybookshelf');
    }).catch((e) => res.status(400).send(e));
  }).catch((e) => {
    res.status(400).send(e);
  });
});

// POST /users/trade/accept-trade to accept a trade from another user.
router.post('/accept-trade', authenticate, (req, res) => {
  let tradeId = req.body.tradeId;
  
  // Find trade by id and set 'status' to 'accepted'.
  Trade.findByIdAndUpdate(tradeId, 
    { $set: { status: 'accepted' } },
    { safe: true, upsert: true, new : true })
  .then((updatedTrade) => {
    res.redirect('/users/mybookshelf');
  }).catch((err) => res.status(400).send(err));
});

// POST /users/trade/decline-trade to decline a trade from another user.
router.post('/decline-trade', authenticate, (req, res) => {
  let tradeId = req.body.tradeId;
  
  // Find trade by id and set 'status' to 'declined'.
  Trade.findByIdAndUpdate(tradeId, 
    { $set: { status: 'declined' } },
    { safe: true, upsert: true, new : true })
  .then((updatedTrade) => {
    res.redirect('/users/mybookshelf');
  }).catch((err) => res.status(400).send(err));
});

module.exports = router;
