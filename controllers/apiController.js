const request = require('request');

// Retrieves book via Google Books api by plugging in book title provided by
// the client.
let googleBooks = (bookTitle, callback) => {
  let apiURL = `https://www.googleapis.com/books/v1/volumes?q=${ bookTitle }` + 
    '&maxResults=1';

  request(apiURL, (err, response, data) => {
    if(err || response.statusCode !== 200) {
      return callback({ error: 'Book not found.'}, null);
    }
    
    let book = JSON.parse(data).items;
    callback(null, book);
  });
};

module.exports = { googleBooks };
