const express = require('express');
const authController = require('./AuthController');
const { authenticateJWT } = require('../../middleware/authMiddleware');
const passport = require('../../config/passport');

const router = express.Router();

/* #swagger.tags = ['Authentication'] */

// Registrazione locale
router.post('/register', (req, res) => authController.register(req, res));

// Login locale
router.post('/login', (req, res) => authController.login(req, res));

// Refresh token (tramite Cookie HttpOnly)
router.post('/refresh', (req, res) => authController.refresh(req, res));

// Logout (invalida sessione e cancella cookie HttpOnly)
router.post('/logout', (req, res) => authController.logout(req, res));

// Dettagli utente corrente (Richiede autenticazione JWT)
router.get('/me', authenticateJWT, (req, res) => authController.me(req, res));

// Aggiornamento preferenze utente (lingua, notifiche, accessibilità)
router.put('/preferences', authenticateJWT, (req, res) => authController.updatePreferences(req, res));

// Richiesta di cambio ruolo (teacher / museumstaff) in attesa di approvazione admin
router.post('/request-role', authenticateJWT, (req, res) => authController.requestRoleUpgrade(req, res));

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:4200';

// Rotte Google OAuth2
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: `${CLIENT_URL}/loginTest?error=google` }), (req, res) => authController.googleCallback(req, res));

module.exports = router;
