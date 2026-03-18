const express = require('express');
const passport = require('passport');
const authController = require('./AuthController');

const router = express.Router();

// Oauth with Google
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  authController.googleCallback
);

// Local registration and login
router.post('/register', authController.register);

// Usiamo il middleware di Passport per intercettare la richiesta, 
// validare le credenziali e, se ok, passare la palla al controller
router.post('/login', 
  passport.authenticate('local', { session: false }), 
  authController.login
);

module.exports = router;
