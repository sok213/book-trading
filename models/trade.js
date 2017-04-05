const mongoose = require('mongoose'),
_              = require('lodash');

let TradeSchema = new mongoose.Schema({
  sentBook: {
    type: Object,
    required: true
  },
  askingBook: {
    type: Object,
    required: true
  },
  sentFrom: {
    type: String,
    required: true
  },
  sentTo: {
    type: String,
    required: true
  }
});

let Trade = mongoose.model('Trade', TradeSchema);

module.exports = { Trade };
