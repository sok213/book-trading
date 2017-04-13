// Default Modules.
const express  = require('express'),
_              = require('lodash'),
{User}         = require('./../models/user'),
{Trade}        = require('./../models/trade'),
{authenticate} = require('./../middleware/authenticate');

// Retrieve Modules.
const router = express.Router();

// GET /users/trade/:id/:userBook to allow the client to select a book
// from the their library and send it to the POST request which creates a 
// sent trade.
router.get('/:id/:userBook', authenticate, (req, res) => {
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
router.post('/propose-trade', authenticate, (req, res) => {
  /*
  * Get client user doc and add book and send book object to client user's 
  * 'sentTrades' array property. Then, get other user doc and add book and
  * client user's 'name' and 'email' property too other user's 'pendingTrades'
  * array property.
  */
  
  let body = _.pick(req.body, ['userBook', 'userId', 'clientBook', 'clientId']);

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
        { $push: { trades: resultTrade._id } },
        { safe: true, upsert: true, new : true })
      .then((thisUser) => {
          if(!thisUser) {
            return res.status(400).send();
          }
      }).catch((e) => res.status(400).send(e));
      
      // Find client user and add the 'sentTrades' object.
      User.findByIdAndUpdate(body.clientId, 
        { $push: { trades: resultTrade._id } },
        { safe: true, upsert: true, new : true })
      .then((thisUser) => {
        if(!thisUser) {
          return res.status(400).send();
        }
        res.redirect('/users/myprofile');
      }).catch((e) => res.status(400).send(e));
      
      //res.send(resultTrade);
    }).catch((e) => {
      res.status(400).send(e);
    });
  });
});

// POST /users/accept-trade to accept a trade from another user.
router.patch('/accept-trade', authenticate, (req, res) => {
  let body = _.pick(req.body, ['tradeId']);
  
  // Find trade by id and set 'status' to 'accepted'.
  Trade.findByIdAndUpdate(body.tradeId, 
    { $set: { status: 'accepted' } },
    { safe: true, upsert: true, new : true })
  .then((updatedTrade) => {
    res.send(updatedTrade);
  }).catch((err) => res.status(400).send(err));
});

// POST /users/decline-trade to decline a trade from another user.
router.patch('/decline-trade', authenticate, (req, res) => {
  let body = _.pick(req.body, ['tradeId']);
  
  // Find trade by id and set 'status' to 'declined'.
  Trade.findByIdAndUpdate(body.tradeId, 
    { $set: { status: 'declined' } },
    { safe: true, upsert: true, new : true })
  .then((updatedTrade) => {
    res.send(updatedTrade);
  }).catch((err) => res.status(400).send(err));
});

module.exports = router;
