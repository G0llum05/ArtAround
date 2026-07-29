const authService = require('../../service/AuthService');
const TokenService = require('../../service/TokenService');
const { RegisterRequestDTO, LoginRequestDTO, RoleUpgradeRequestDTO, AuthResponseDTO } = require('../../data/model/dto/AuthDTO');
const { setRefreshTokenCookie, clearRefreshTokenCookie, getRefreshTokenFromCookie } = require('../../utils/cookieHelper');
const RoleManagementService = require('../../service/RoleManagementService');

class AuthController {
  /**
   * POST /api/auth/register
   * Registrazione Utente Locale.
   */
  async register(req, res) {
    try {
      const { name, surname, email, password, role } = req.body;
      if (!name || !surname || !email || !password) {
        return res.status(400).json({ message: 'Tutti i campi obbligatori (name, surname, email, password) devono essere compilati.' });
      }

      const registerDTO = new RegisterRequestDTO(name, surname, email, password, role);
      const clientIp = req.ip || req.connection.remoteAddress;

      const result = await authService.registerLocalUser(registerDTO, clientIp);

      // Impostiamo il Refresh Token nel Cookie HttpOnly
      setRefreshTokenCookie(res, result.refreshToken);

      res.status(201).json(new AuthResponseDTO(result.user, result.accessToken));
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * POST /api/auth/login
   * Login Utente Locale.
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email e password sono obbligatorie.' });
      }

      const clientIp = req.ip || req.connection.remoteAddress;
      const result = await authService.loginLocalUser(email, password, clientIp);

      // Impostiamo il Refresh Token nel Cookie HttpOnly
      setRefreshTokenCookie(res, result.refreshToken);

      res.status(200).json(new AuthResponseDTO(result.user, result.accessToken));
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  }

  /**
   * POST /api/auth/refresh
   * Rinnovo dell'Access Token tramite Refresh Token inviato nel Cookie HttpOnly.
   */
  async refresh(req, res) {
    try {
      const refreshToken = getRefreshTokenFromCookie(req);
      if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh Token mancante nei cookie HTTP-Only.' });
      }

      const clientIp = req.ip || req.connection.remoteAddress;
      const result = await authService.refreshSession(refreshToken, clientIp);

      // Aggiorniamo il Cookie HttpOnly con il nuovo Refresh Token (rotazione)
      setRefreshTokenCookie(res, result.refreshToken);

      res.status(200).json(new AuthResponseDTO(result.user, result.accessToken));
    } catch (error) {
      clearRefreshTokenCookie(res);
      res.status(401).json({ message: error.message });
    }
  }

  /**
   * POST /api/auth/logout
   * Logout: Invalida la sessione e cancella il Cookie HttpOnly.
   */
  async logout(req, res) {
    try {
      const refreshToken = getRefreshTokenFromCookie(req);
      await authService.logout(refreshToken);
      clearRefreshTokenCookie(res);

      res.status(200).json({ message: 'Logout effettuato con successo. Sessione terminata.' });
    } catch (error) {
      clearRefreshTokenCookie(res);
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * GET /api/auth/me
   * Restituisce i dettagli dell'utente attualmente autenticato (UserResponseDTO).
   */
  async me(req, res) {
    try {
      const userDTO = await authService.getMe(req.user.id);
      res.status(200).json(userDTO);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  /**
   * PUT /api/auth/preferences
   * Aggiorna le preferenze dell'utente autenticato (es. lingua, notifiche, esigenze particolari).
   */
  async updatePreferences(req, res) {
    try {
      const { preferences } = req.body;
      if (!preferences || typeof preferences !== 'object') {
        return res.status(400).json({ message: 'Il campo preferences deve essere un oggetto chiave-valore valido.' });
      }

      const updatedUserDTO = await authService.updateUserPreferences(req.user.id, preferences);
      res.status(200).json({
        message: 'Preferenze aggiornate con successo.',
        user: updatedUserDTO
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * POST /api/auth/request-role
   * Richiesta di upgrade a 'teacher' o 'museumstaff' da parte dell'utente.
   */
  async requestRoleUpgrade(req, res) {
    try {
      const { requestedRole } = req.body;
      const updatedUser = await RoleManagementService.requestRoleUpgrade(req.user.id, requestedRole);
      res.status(200).json({
        message: `Richiesta per il ruolo '${requestedRole}' inviata con successo. In attesa di approvazione da parte di un Amministratore.`,
        user: updatedUser
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * Callback di Google OAuth2: imposta il Cookie HttpOnly in modo sicuro e reindirizza senza token nella query string.
   */
  async googleCallback(req, res) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:4200';
    try {
      if (!req.user) return res.redirect(`${clientUrl}/loginTest?error=auth_failed`);
      const clientIp = req.ip || req.connection.remoteAddress;

      const refreshToken = await TokenService.generateRefreshToken(req.user, clientIp);
      setRefreshTokenCookie(res, refreshToken);

      // Reindirizzamento pulito al frontend Angular
      res.redirect(`${clientUrl}/loginTest?status=success`);
    } catch (error) {
      console.error('Errore Google OAuth Callback:', error);
      res.redirect(`${clientUrl}/loginTest?error=oauth_error`);
    }
  }
}

module.exports = new AuthController();
