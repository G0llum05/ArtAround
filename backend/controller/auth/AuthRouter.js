const express = require('express');
const authController = require('./AuthController');
const { authenticateJWT } = require('../../middleware/authMiddleware');
const passport = require('../../config/passport');

const router = express.Router();

// api/auth

// Registrazione locale e verifica codice
router.post('/signup', (req, res) => authController.signup(req, res));
router.post('/verify-code', (req, res) => authController.verifyCode(req, res));
router.get('/verifyEmail', (req, res) => authController.verifyEmail(req, res));


// Login locale
router.post('/login', (req, res) => authController.login(req, res));

// Logout (invalida sessione e cancella cookie HttpOnly)
router.post('/logout', (req, res) => authController.logout(req, res));

// Refresh token (tramite Cookie HttpOnly)
router.post('/refresh', (req, res) => authController.refresh(req, res));

// Dettagli utente corrente (Richiede autenticazione JWT)
router.get('/me', authenticateJWT, (req, res) => authController.me(req, res));

// Aggiornamento preferenze utente (lingua, notifiche, accessibilità)
router.put('/preferences', authenticateJWT, (req, res) => authController.updatePreferences(req, res));

// Richiesta di cambio ruolo (teacher / museumstaff) in attesa di approvazione admin
router.post('/request-role', authenticateJWT, (req, res) => authController.requestRoleUpgrade(req, res));

const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:4200').trim();

// Rotte Google OAuth2
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] })); // scope: richiede accesso a profilo (nome, cognome, foto) e email. Questa chiamata fa il redirect a Google

router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: `${CLIENT_URL}/login?error=google` }), // lancia la funzione settata in passport.js (loginWithGoogle)
  (req, res) => authController.googleCallback(req, res)); // se è loggato senza errori avvia il controller per il callback per token, cookie etc

module.exports = router;
