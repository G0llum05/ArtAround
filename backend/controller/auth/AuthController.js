const authService = require('../../service/AuthService');
const TokenService = require('../../service/TokenService');
const AuthMapper = require('../../data/mapper/AuthMapper');
const { setRefreshTokenCookie, clearRefreshTokenCookie, getRefreshTokenFromCookie } = require('../../utils/cookieHelper');
const RoleManagementService = require('../../service/RoleManagementService');

class AuthController {

  /**
   * POST /api/auth/signup
   */
  async signup(req, res) {
    try {
      const signupDTO = AuthMapper.toSignupRequestDTO(req.body);

      const { name, surname, email, password } = signupDTO;
      if (!name || !surname || !email || !password) {
        return res.status(400).json({
          type: 'error',
          message: 'Tutti i campi obbligatori (name, surname, email, password) devono essere compilati.'
        });
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email.toLowerCase().trim())) {
        return res.status(400).json({
          type: 'error',
          message: 'Il formato dell\'indirizzo email inserito non è valido.'
        });
      }

      const result = await authService.signup(signupDTO);
      const msg = result?.message;

      res.status(201).json({
        type: 'success',
        message: msg
      });
    } catch (error) {
      res.status(400).json({
        type: 'error',
        message: error.message
      });
    }
  }

  async verifyEmail(req, res) {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({
          type: 'error',
          message: 'Token di verifica mancante'
        });
      }

      const verifiedUser = await authService.verifyEmail(token);
      if (!verifiedUser) {
        return res.status(400).json({
          type: 'error',
          message: 'Token di verifica non valido'
        });
      }

      res.redirect(`${process.env.CLIENT_URL}/login?status=verified`);
    } catch (error) {
      res.status(400).json({
        type: 'error',
        message: error.message
      });
    }
  }

  async verifyCode(req, res) {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({
          type: 'error',
          message: 'Email e codice di verifica sono obbligatori.'
        });
      }

      const clientIp = req.ip || req.connection.remoteAddress;
      const result = await authService.verifyCode(email, code, clientIp);

      // Imposta il refresh token nei cookie HTTP-Only sicuri (come nel login)
      setRefreshTokenCookie(res, result.refreshToken);

      // Restituisce la risposta con il DTO del profilo utente e i token
      const responseDTO = AuthMapper.toLoginResponseDTO(
        result.user,
        result.accessToken,
        result.refreshToken,
        'success',
        'Email verificata con successo! Accesso effettuato.'
      );
      res.status(200).json(responseDTO);
    } catch (error) {
      res.status(400).json({
        type: 'error',
        message: error.message
      });
    }
  }


  /**
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const loginDTO = AuthMapper.toLoginRequestDTO(req.body, req.ip || req.connection.remoteAddress);

      if (!loginDTO.email || !loginDTO.password) {
        return res.status(400).json({
          type: 'error',
          message: 'Email e password obbligatorie.'
        });
      }

      const result = await authService.loginLocalUser(loginDTO.email, loginDTO.password, loginDTO.ip);

      // mettiamo il refresh token nel cookie 
      setRefreshTokenCookie(res, result.refreshToken);

      const responseDTO = AuthMapper.toLoginResponseDTO(
        result.user,
        result.accessToken,
        result.refreshToken,
        'success',
        'Login effettuato con successo.'
      );
      if (!responseDTO) {
        return res.status(500).json({
          type: 'error',
          message: 'Errore nella creazione della risposta di login.'
        });
      }

      res.status(200).json(responseDTO);
    } catch (error) {
      res.status(401).json({
        type: 'error',
        message: error.message
      });
    }
  }


  /**
    * POST /api/auth/refresh
    * nuovo access token tramite refresh inviato nel Cookie HttpOnly.
    */
  async refresh(req, res) {
    try {
      const refreshToken = getRefreshTokenFromCookie(req); // prendiamo refresh token dal cookie sicuro
      if (!refreshToken) {
        return res.status(401).json({
          type: 'error',
          message: 'Refresh Token mancante nei cookie HTTP-Only.'
        });
      }

      const clientIp = req.ip || req.connection.remoteAddress;
      const result = await authService.refreshSession(refreshToken, clientIp);

      // mettiano nuovo token nel cookie
      setRefreshTokenCookie(res, result.refreshToken);

      const responseDTO = AuthMapper.toLoginResponseDTO(
        result.user,
        result.accessToken,
        result.refreshToken,
        'success',
        'Sessione rinnovata con successo.'
      );
      res.status(200).json(responseDTO);
    } catch (error) {
      clearRefreshTokenCookie(res);
      res.status(401).json({
        type: 'error',
        message: error.message
      });
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

      res.status(200).json({
        type: 'success',
        message: 'Logout effettuato con successo. Sessione terminata.'
      });
    } catch (error) {
      clearRefreshTokenCookie(res);
      res.status(500).json({
        type: 'error',
        message: error.message
      });
    }
  }


  // TODO CHECK FINIRE GUARDARE IL RESTO DEL FILE
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
    * qui il login è già avvenuto con successo
    * Callback di Google OAuth2: imposta il Cookie HttpOnly in modo sicuro e reindirizza senza token nella query string.
    * @param {Object} req - Oggetto della richiesta Express.
    */
  async googleCallback(req, res) {
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:4200').trim();
    try {
      if (!req.user) return res.redirect(`${clientUrl}/login?error=auth_failed`);
      const clientIp = req.ip || req.connection.remoteAddress;

      const result = await authService.googleCallback(req.user, clientIp);
      setRefreshTokenCookie(res, result.refreshToken);

      // Reindirizzamento pulito al frontend-old Angular
      res.redirect(`${clientUrl}/login?status=success`);
    } catch (error) {
      console.error('Errore Google OAuth Callback:', error);
      res.redirect(`${clientUrl}/login?error=oauth_error`);
    }
  }

  /**
   * Endpoint per popolare il database coi seed on-demand
   */
  async triggerSeed(req, res) {
    try {
      const { runSeed } = require('../../scripts/seedDatabase');
      const result = await runSeed({ isStandalone: false });
      return res.status(200).json({
        type: 'success',
        message: 'Database popolato con successo coi dati di seed!',
        data: result
      });
    } catch (error) {
      console.error('[Seed Endpoint Error]:', error);
      return res.status(500).json({
        type: 'error',
        message: error.message
      });
    }
  }
}

module.exports = new AuthController();
