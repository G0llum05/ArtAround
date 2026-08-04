// backend/config/passport.js
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const authService = require('../service/AuthService');

passport.use(new LocalStrategy({
    usernameField: 'email', // Diciamo a Passport che usiamo 'email' e non 'username'
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      // Usiamo il metodo che hai creato tu nel Service!
      const user = await authService.verifyLocalUser(email, password);
      
      // Se verifyLocalUser lancia un errore (es. "Invalid credentials"), 
      // finisce nel catch qui sotto. Se invece va tutto bene:
      return done(null, user); 
    } catch (error) {
      // Restituiamo false per dire a Passport "Login Fallito", passando l'errore
      return done(null, false, { message: error.message }); 
    }
  }
));

const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.trim() : null;
const defaultCallback = clientUrl ? `${clientUrl}/api/auth/google/callback` : "http://localhost:8000/api/auth/google/callback";
const callbackURL = process.env.GOOGLE_CALLBACK_URL ? process.env.GOOGLE_CALLBACK_URL.trim() : defaultCallback;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,         // Preso dal file .env
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Preso dal file .env
    callbackURL: callbackURL                         // URL completo per la callback Google
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Usiamo il tuo metodo findOrCreateGoogleUser
      const user = await authService.findOrCreateGoogleUser(profile);
      return done(null, user);
    } catch (error) { 
      return done(error, null); 
    }
  }
));

module.exports = passport;
