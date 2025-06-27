const express = require('express');
const passport = require('passport');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github').Strategy;
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();  // Load environment variables

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure required environment variables are set
const { MONGO_URI, SESSION_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env;

if (!MONGO_URI || !SESSION_SECRET || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

// MongoDB connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Configure MongoDB session store
const store = new MongoDBStore({
  uri: MONGO_URI,
  collection: 'sessions'
});

// Catch errors from session store
store.on('error', function(error) {
  console.error('Session store error:', error);
});

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL (React/Next.js)
  credentials: true, // Allow sending cookies
}));

app.use(express.json()); // For parsing JSON requests
app.use(express.urlencoded({ extended: true })); // For parsing URL-encoded bodies

// Session configuration
app.use(session({
  secret: SESSION_SECRET, // Use a strong secret key
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Set to `true` in production for HTTPS
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  }
}));

// Initialize Passport.js and session handling
app.use(passport.initialize());
app.use(passport.session());

// User model definition
const User = mongoose.model('User', new mongoose.Schema({
  googleId: String,
  githubId: String,
  displayName: String,
  email: String,
  profilePic: String,
}));

// Passport serialization and deserialization
passport.serializeUser((user, done) => {
  done(null, user.id); // Store user ID in the session
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user); // Retrieve user from DB using ID
  } catch (error) {
    done(error, null);
  }
});

// Passport strategy for Google OAuth
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:5000/api/auth/callback/google',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = new User({
        googleId: profile.id,
        displayName: profile.displayName,
        email: profile.emails[0].value,
        profilePic: profile.photos[0].value,
      });
      await user.save();
    }
    return done(null, user);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error);
  }
}));

// Passport strategy for GitHub OAuth
passport.use(new GitHubStrategy({
  clientID: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  callbackURL: 'http://localhost:5000/api/auth/callback/github',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ githubId: profile.id });
    if (!user) {
      user = new User({
        githubId: profile.id,
        displayName: profile.displayName || profile.username,
        email: profile.emails[0]?.value,
        profilePic: profile.photos[0]?.value,
      });
      await user.save();
    }
    return done(null, user);
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return done(error);
  }
}));

// Authentication Routes
app.get('/api/auth/login', (req, res) => {
  res.send('<a href="/api/auth/google">Login with Google</a><br><a href="/api/auth/github">Login with GitHub</a>');
});

// Google Authentication Route
app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth Callback Route
app.get('/api/auth/callback/google', passport.authenticate('google', { failureRedirect: '/api/auth/login' }), (req, res) => {
  res.redirect('http://localhost:3000/dashboard');
});

// GitHub Authentication Route
app.get('/api/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

// GitHub OAuth Callback Route
app.get('/api/auth/callback/github', passport.authenticate('github', { failureRedirect: '/api/auth/login' }), (req, res) => {
  res.redirect('http://localhost:3000/dashboard');
});

// Logout Route
app.get('/api/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/api/auth/login');
  });
});

// Get authenticated user data
app.get('/api/auth/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user); // Send user data
  } else {
    res.status(401).send('Not authenticated');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).send('Something went wrong!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
