// backend/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const AuthMapper = require('../mapper/AuthMapper');
const authService = require('../service/AuthService');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
},
  async (profile, done) => {
    try {
      const googleProfileDTO = AuthMapper.toGoogleProfileDTO(profile);
      // metodo loginWithGoogle nel service auth
      const user = await authService.loginWithGoogle(googleProfileDTO);
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

module.exports = passport;
