/*
* Some portions of code in this application are borrowed from 
* "The Complete NodeJS Course - 2" by Andrew Mead from Udemy.com
*/

const express  = require('express'),
path           = require('path'),
mongoose       = require('mongoose'),
config         = require('./config'),
bodyParser     = require('body-parser'),
expressValid   = require('express-validator'),
app            = express(),
session        = require('express-session'),
cookieParser   = require('cookie-parser'),
passport       = require('passport'),
{User}         = require('./models/user'),
{Trade}        = require('./models/trade'),
{authenticate} = require('./middleware/authenticate'),
{ObjectID}     = require('mongodb'),
{googleBooks}  = require('./controllers/apiController'),
handleBars     = require('express-handlebars'),
port           = process.env.PORT || 3000,
db             = mongoose.connect(config.getDbConnectionString());

// Retrieve routes.
const usersRoute = require('./routes/users'),
indexRoute       = require('./routes/index'),
tradeRoute       = require('./routes/trade');

// Set views and view engine to handleBars.
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', handleBars({defaultLayout: 'layout'}));
app.set('view engine', 'handlebars');

// Set the assets folder.
app.use(express.static(path.join(__dirname, 'public')));

// Sets Bootstrap and jQuery.
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js'));
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); 
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));

// Set module folder 
app.use('/font-awesome', express.static(__dirname + 
  '/node_modules/font-awesome'));
  
// Set bodyParser and cookieParser module. 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser()); 

// Configure session module.
app.use(session({
  secret: 'secret',
  saveUninitialized: true,
  resave: true
}));

// Configure passport module.
app.use(passport.initialize());
app.use(passport.session());
  
// Configure express-validator module.
// NOTE** This code snippet is borrowed from the express-validator
// documentation from github.
app.use(expressValid({
  errorFormatter: (param, msg, value) => {
      let namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

// Sets local variables to be used with HandleBars views.
app.use((req, res, next) => {
  res.locals.user = app.locals.user || null;
  res.locals.getLength = (trades) => {
    return trades.length;
  };
  next();
});

// Set routes.
app.use('/', indexRoute); 
app.use('/users', usersRoute);
app.use('/users/trade', tradeRoute);

app.listen(port, () => console.log('Listening on PORT: ', port));
