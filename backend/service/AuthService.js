const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Resend } = require('resend');
const User = require('../data/model/User');
const TokenService = require('./TokenService');
const RoleManagementService = require('./RoleManagementService');
const UserMapper = require('../data/mapper/UserMapper');

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
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value.toLowerCase().trim() : null;
    if (!email) {
      throw new Error('Nessun indirizzo email restituito dal profilo Google.');
    }

    const googleId = profile.id;
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
    // utente locale già registrato e verificato
    if (existingUser.isEmailVerified) {
      throw new Error("L'indirizzo email è già registrato. Effettua il login.");
    }

    const attempts = existingUser.nOfEmailVerificationAttempts;
    // CHECK se uno tenta più di 3 volte non potrà MAI MAI più fare signup
    if (attempts >= 3) {
      throw new Error("Hai superato il numero massimo di tentativi di verifica email. Contatta l'assistenza per sbloccare l'account.");
    }

    const isTokenExpired = existingUser.emailVerificationExpires && existingUser.emailVerificationExpires < Date.now();
    if (!isTokenExpired) {
      throw new Error("L'indirizzo email è già registrato. Controlla la cartella spam o attendi la scadenza del link prima di richiederne uno nuovo.");
    }

    // token è scaduto o non è stato fatto ancora un tentativo
    const { token, expires } = this._generateVerificationToken();
    // se utente già registrato con google vengono sovrascritti i dati anche se non è ancora verificato. Scelta implementativa per semplicità (bisognerebbe creare un utente temporaneo e poi solo se la verifica va a buon fine sovrascrivere i dati dell'utente vero) 
    existingUser.name = name;
    existingUser.surname = surname;
    existingUser.password = hashedPassword;
    existingUser.emailVerificationToken = token;
    existingUser.emailVerificationExpires = expires;
    existingUser.nOfEmailVerificationAttempts = attempts + 1;

    await existingUser.save();
    // bisogna verificare sempre l'email
    await this._sendVerificationEmail(existingUser, token);

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
    if (newLocalUser) {
      ({ token, expires } = this._generateVerificationToken());
    }

    const newUser = new User({
      name: name,
      surname: surname,
      email: email,
      password: hashedPassword,
      googleId: googleId || null,
      isEmailVerified: false,
      emailVerificationToken: token,
      emailVerificationExpires: expires,
      nOfEmailVerificationAttempts: 0,
      role: roleConfig.role,
      roleStatus: roleConfig.roleStatus,
      requestedRole: roleConfig.requestedRole
    });

    await newUser.save();
    if (newLocalUser && token) {
      await this._sendVerificationEmail(newUser, token);
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
   * token casuale a 32 byte con scadenza a 1 ora
   */
  _generateVerificationToken() {
    return {
      token: crypto.randomBytes(32).toString('hex'),
      expires: Date.now() + 60 * 60 * 1000 // 1 ora
    };
  }


  /**
   * email di verifica tramite Resend
   */
  async _sendVerificationEmail(user, token) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    // link di conferma
    const verifyUrl = `${process.env.BACKEND_URL}/api/auth/verifyEmail?token=${token}`;

    try {
      const data = await resend.emails.send({
        // indirizzo di test fornito da resend: 'onboarding@resend.dev'
        from: 'ArtAround <onboarding@resend.dev>',
        to: user.email,
        subject: 'no-reply: conferma email per il tuo account su ArtAround',
        html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2>Ciao ${user.name},</h2>
                <p>Grazie per esserti registrato su <strong>ArtAround</strong>!</p>
                <p>Clicca sul pulsante sottostante per verificare la tua email:</p>
                <p style="margin: 25px 0;">
    		  <a href="${verifyUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-
  decoration: none; border-radius: 6px; font-weight: bold;">Conferma Account</a>
                </p>
                <p>Se il pulsante non funziona, incolla questo link nel browser:</p>
                <p><a href="${verifyUrl}">${verifyUrl}</a></p>
              </div>
            `
      });
      console.log('[AuthService] Email di verifica inviata a:', user.email, 'Message ID:', data.id);
    } catch (err) {
      console.error('[AuthService] Errore invio email di verifica:', err.message);
    }
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
    return await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });
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
