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
LocalStrategy  = require('passport-local').Strategy,
flash          = require('connect-flash'),
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

// Set bodyParser and cookieParser module. 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser()); 

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

// Configure session module.
app.use(session({
  secret: 'secret',
  saveUninitialized: true,
  resave: true
}));

// Configure passport module.
app.use(passport.initialize());
app.use(passport.session());

// Set flash module.
app.use(flash());

// Sets local variables to be used with HandleBars views.
app.use((req, res, next) => {
  console.log('Setting res.locals variables...');
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  res.locals.title = 'the knawledge tree';
  res.locals.getLength = (trades) => {
    return trades.length;
  };
  next();
});

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

// Configure the Passport LocalStrategy for email/password authentication.
passport.use(new LocalStrategy(
  {
    usernameField: 'email'
  },
  (email, password, done) => {
    
    // Invoke getUserByEmail function from './models/users.js'.
    User.getUserByEmail(email, (err, user) => {
      //If user not found, return done() method with message of 'Unknown User'.
      if(err) throw err;
      if(!user) {
        return done(null, false, {message: 'Unknown user'});
      }

      // If user found, run comparePassword() function 
      // from './models/users.js'.
      User.comparePassword(password, user.password, (err, isMatch) => {
        if(err) throw err;
        
        // If provided password matches the hashed password, retrun done() with
        // user passes in as parameter. Else, return done() with 
        // 'Invalid password'.
        if(isMatch) {
          return done(null, user);
        }
        
        return done(null, false, {message: 'Invalid password'});
      });
    });
  }
));

// Serialize and deserialize user instances to and from the Passport session.
// A session will be established and maintained via a cookie set in the 
// user's browser.
passport.serializeUser((user, done) => {
  // The user ID is serialized to the session.
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.getUserById(id, (err, user) => {
    done(err, user);
  });
});

// Set routes.
app.use('/', indexRoute); 
app.use('/users', usersRoute);
app.use('/users/trade', tradeRoute);

app.listen(port, () => console.log('Listening on PORT: ', port));
