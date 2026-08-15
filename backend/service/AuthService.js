const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../data/model/User');
const TokenService = require('./TokenService');
const RoleManagementService = require('./RoleManagementService');
const UserMapper = require('../data/mapper/UserMapper');
const Mailer = require('../middleware/mailerMiddleware');
class AuthService {


  /**
    * POST api/auth/signup
    * registrazione utente locale, non accesso con google. Verifica account tramite verifica email.
    * @param {Object} signupData - dati di registrazione (name, surname, email, password)
    * @returns {Promise<Object>} - nuovo utente creato
    * @throws {Error} - errore se l'email è già registrata o altri errori di validazione
  */
  async signup(signupData) {
    const { email, name, surname, password } = signupData;
    if (!email || !name || !surname || !password) {
      throw new Error('Tutti i campi obbligatori (name, surname, email, password) devono essere compilati.');
    }
    const hashedPassword = await this._hashPassword(signupData.password);
    const existingUser = await this._getUserByEmail(email);
    if (existingUser) {
      await this._handleExistingUserForLocalSignup(existingUser, name, surname, hashedPassword);
      return { message: 'Un nuovo link di verifica è stato inviato alla tua email.' };
    }

    await this._createNewUser(email, name, surname, hashedPassword, null, true);
    return { message: 'Registrazione completata. Controlla la tua email per confermare l\'account.' };
  }


  /**
  * POST api/auth/verifi-email
  * Verifica l'email dell'utente utilizzando il token di verifica.
  * @param {string} token - token di verifica generato da back
  * @returns {Promise<boolean>} - successo
  * @throws {Error} - errore se il token non è valido o è scaduto
  */
  async verifyEmail(token) {
    const user = await this._getUserByVerificationToken(token);
    if (!user) {
      throw new Error('Token di verifica non valido o scaduto.');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();
    return true;
  }


  /**
   * Processa l'inputCode dell'utente per la verifica via email.
   * A seguito della verifica riuscita, genera i token di sessione ed il profilo utente.
   * @param {string} email - Email dell'utente
   * @param {string} inputCode - Codice a 6 cifre inserito
   * @param {string} ipAddress - Indirizzo IP del client
   * @returns {Promise<Object>} - Oggetto con user, accessToken e refreshToken
   */
  async verifyCode(email, inputCode, ipAddress) {
    if (!email || !inputCode) {
      throw new Error('Email e codice di verifica sono obbligatori.');
    }

    const user = await this._getUserByEmail(email);
    if (!user) {
      throw new Error('Utente non trovato.');
    }

    // Verifica il codice ed incrementa gli tentativi o elimina il record se corretto
    await TokenService.verifyCode(user._id, inputCode);

    // Genera i token di sessione (accessToken e refreshToken) come nel login
    const accessToken = TokenService.generateAccessToken(user);
    const refreshToken = await TokenService.generateRefreshToken(user, ipAddress);

    return {
      user: user,
      accessToken,
      refreshToken
    };
  }



  /**
  * POST api/auth/login
  * login utente locale
  * @
  */
  async loginLocalUser(email, password, ipAddress) {
    const user = await this._getUserByEmail(email);
    if (!user) {
      throw new Error('Credenziali non valide.');
    }
    if (!user.password) {
      throw new Error('Questo account è stato registrato solo tramite Google. Effettua il login con Google.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Credenziali non valide.');
    }

    const accessToken = TokenService.generateAccessToken(user);
    const refreshToken = await TokenService.generateRefreshToken(user, ipAddress);

    return {
      user: user,
      accessToken,
      refreshToken
    };
  }


  /**
  * callback del login con google. Attivato tramite Passport (passport.js)
  * @param {Object} profile - profilo utente restituito da Google (id, name, surname, email)
  * @returns {Promise<Object>} - utente esistente o nuovo utente creato
  */
  async loginWithGoogle(profile) {
    console.log('[AuthService] loginWithGoogle profile:', profile);
    const email = profile.email
    if (!email) {
      throw new Error('Nessun indirizzo email restituito dal profilo Google.');
    }

    const googleId = profile.googleId;
    if (!googleId) {
      throw new Error('Nessun ID Google restituito dal profilo.');
    }

    const user = await this._getUserByEmail(email);
    if (user) {
      return await this._handleExistingUserForGoogleSignup(user, googleId);

    } else { // primo log, va creato l'utente
      await this._createNewUser(email, profile.name, profile.surname, null, googleId, false);
      return await this._getUserByEmail(email);
    }
  }


  /**
   * 
   * @param {*} user 
   * @param {*} ipAddress 
   * @returns 
   */
  async googleCallback(user, ipAddress) {
    if (!user) {
      throw new Error('Utente non trovato dopo il login con Google.');
    }

    const accessToken = TokenService.generateAccessToken(user);
    const refreshToken = await TokenService.generateRefreshToken(user, ipAddress);

    return {
      user: user,
      accessToken,
      refreshToken
    };
  }


  /**
   * gestione registrazione utenti già presenti nel DB per le registrazioni locali
   */
  async _handleExistingUserForLocalSignup(existingUser, name, surname, hashedPassword) {
    // controllo se esiste un codice attivo e se ha superato i tentativi
    const activeCode = await TokenService.getActiveCode(existingUser._id);
    if (activeCode && activeCode.attempts >= TokenService.getMaxAttempts()) {
      throw new Error("Hai superato il numero massimo di tentativi di verifica email. Contatta l'assistenza per sbloccare l'account.");
    }

    // genera e invia nuovo codice di verifica per la registrazione (isLogin = false)
    await this._createAndSendVerificationCode(existingUser, false);

    return {
      message: 'Un nuovo link di verifica è stato inviato alla tua email.',
      user: existingUser
    };
  }


  /**
    * gestione registrazione utenti già presenti nel DB per le registrazioni con google
    */
  async _handleExistingUserForGoogleSignup(existingUser, googleId) {
    // utente già registrato con google
    if (existingUser.googleId) {
      return existingUser;
    }

    // TODO CHECK Srebbe da fare un listener che elimina gli utenti che non si sono verificati entro il limite del token 
    // utente già registrato con email ma non con google, devo guardare se l'email è verificata
    if (!existingUser.isEmailVerified) {
      throw new Error("L'indirizzo email è già registrato ma non è stato verificato. Controlla la tua email per confermare l'account o richiedi un nuovo link di verifica.");
    }

    // utente già registrato con email e verificato, ora lo registro anche con google
    existingUser.googleId = googleId;
    // non tengo i dati di google (nome e cognome) perchè se uno ha scelto di con nome e cognome hanno priorità su quelli base di google
    await existingUser.save();
    return existingUser;
  }


  /**
  * crea nuovo utente locale non verificato e invia l'email di conferma.
  * @param {Object} signupData - dati di registrazione (name, surname, email, password)
  * @param {string} email - email dell'utente
  * @param {string} hashedPassword - password hashata
  * @param {string} googleId - id google dell'utente (se registrato con google)
  * @param {boolean} newLocalUser - true se è un nuovo utente locale, false se è un utente da registrare con google
  * @returns {Promise<Object>} - nuovo utente creato
  * @throws {Error} - errore se la creazione dell'utente fallisce
  */
  async _createNewUser(email, name, surname, hashedPassword, googleId, newLocalUser) {
    const roleConfig = await RoleManagementService.determineUserRoleOnSignup(email, null);

    let token = null;
    let expires = null;
    // Per il momento non verifico l'email, quindi non genero il token di verifica
    // if (newLocalUser) {
    // ({ token, expires } = this._generateVerificationToken());
    // }

    const newUser = new User({
      name: name,
      surname: surname,
      email: email,
      password: hashedPassword,
      googleId: googleId || undefined,
      role: roleConfig.role,
      roleStatus: roleConfig.roleStatus,
      requestedRole: roleConfig.requestedRole
    });

    await newUser.save();
    if (newLocalUser) {
      await this._createAndSendVerificationCode(newUser, false);
    }

    return {
      message: 'Registrazione completata. Controlla la tua email per confermare l\'account.',
      user: newUser
    };
  }


  /**
   * hash password
   */
  async _hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }


  /**
   * email di verifica tramite Resend
   */
  async _createAndSendVerificationCode(user, isLogin) {
    console.log(`[AuthService Debug] Avvio creazione codice di verifica per l'utente: ${user.email}`);
    const codeStart = Date.now();
    const code = await TokenService.createVerificationMailCode(user);
    console.log(`[AuthService Debug] Codice generato in ${Date.now() - codeStart}ms (${code}). Invio mail tramite Mailer...`);
    await Mailer.sendLoginConfirmation(user.email, user.name, code, isLogin);
    console.log(`[AuthService Debug] Procedura _createAndSendVerificationCode completata per ${user.email}.`);
  }


  /**
   * Cerca un utente per email restituendo il Mongoose Document (senza .lean()).
   */
  async _getUserByEmail(email) {
    if (!email) return null;
    return await User.findOne({ email: email.toLowerCase().trim() });
  }


  /**
   * Cerca un utente per Google ID.
   */
  async _getUserByGoogleId(googleId) {
    return await User.findOne({ googleId });
  }


  async _getUserByVerificationToken(token) {
    if (!token || token.expiresAt <= new Date()) {
      throw new Error('Codice di Verifica non più valido!')
    }
    const id = token.userId;
    const user = await User.findById({ id });
  }

  /**
   * Rotazione e Rinnovo del Refresh Token.
   */
  async refreshSession(refreshToken, ipAddress) {
    const storedToken = await TokenService.verifyAndGetRefreshToken(refreshToken);
    if (!storedToken) {
      throw new Error('Refresh Token non valido o scaduto.');
    }

    const userId = storedToken.userId;
    if (!userId) {
      throw new Error('Refresh Token non valido: utente non trovato.');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Utente non trovato per il Refresh Token fornito.');
    }

    // nuovo refresh
    const newRefreshToken = await TokenService.generateRefreshToken(user, ipAddress);

    // revoca vecchio
    await TokenService.revokeRefreshToken(refreshToken, ipAddress, newRefreshToken);

    // nuovo access
    const newAccessToken = TokenService.generateAccessToken(user);

    return {
      user: user,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  /**
   * Logout: Revoca il Refresh Token attivo.
   */
  async logout(refreshToken) {
    if (refreshToken) {
      await TokenService.revokeRefreshToken(refreshToken);
    }
  }

  // TODO CHECK FINIRE GUARDARE IL RESTO DEL FILE
  /**
   * Restituisce il profilo dell'Utente autenticato via ID.
   */
  async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Utente non trovato.');
    }

    const { isAdminEmail } = require('../config/adminRegistry');
    if (isAdminEmail(user.email) && user.role !== 'admin') {
      user.role = 'admin';
      user.roleStatus = 'approved';
      await user.save();
    }

    return UserMapper.toUserResponseDTO(user);
  }

  /**
   * Aggiorna le preferenze dell'Utente (lingua, notifiche, accessibilità) e restituisce il UserResponseDTO.
   */
  async updateUserPreferences(userId, preferences) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Utente non trovato.');
    }

    if (!user.preferences) {
      user.preferences = new Map();
    }

    if (typeof preferences === 'object' && preferences !== null) {
      Object.entries(preferences).forEach(([key, value]) => {
        user.preferences.set(key, String(value));
      });
    }

    await user.save();
    return UserMapper.toUserResponseDTO(user);
  }
}

module.exports = new AuthService();
