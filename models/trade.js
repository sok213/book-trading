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
    _id: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true
    }
  },
  sentTo: {
    _id: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    required: true,
    default: 'pending'
  }
});

let Trade = mongoose.model('Trade', TradeSchema);

module.exports = { Trade };
