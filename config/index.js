// Retrieves the JSON object from config.json file.
const configValues = require('./config');

// Exports the mLab URI by getting values from configValues and parsing it 
// into a string.
module.exports = {
  getDbConnectionString: () => {
    return `mongodb://${ configValues.user }:${ configValues.pwd }` + 
    `@ds145380.mlab.com:45380/book-trade`;
  }
};
