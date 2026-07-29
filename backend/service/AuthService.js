const bcrypt = require('bcryptjs');
const User = require('../data/model/User');
const TokenService = require('./TokenService');
const RoleManagementService = require('./RoleManagementService');
const UserMapper = require('../data/mapper/UserMapper');

class AuthService {
  /**
   * Cerca un utente per email restituendo il Mongoose Document (senza .lean()).
   */
  async getUserByEmailModel(email) {
    if (!email) return null;
    return await User.findOne({ email: email.toLowerCase().trim() });
  }

  /**
   * Cerca un utente per Google ID.
   */
  async getUserByGoogleId(googleId) {
    return await User.findOne({ googleId });
  }

  /**
   * Registrazione Utente Locale.
   */
  async registerLocalUser(registerData, ipAddress = '') {
    const cleanEmail = registerData.email.toLowerCase().trim();

    const existingUser = await this.getUserByEmailModel(cleanEmail);
    if (existingUser) {
      throw new Error('Un utente con questa email risulta già registrato.');
    }

    // Hash della Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(registerData.password, salt);

    // Calcolo del Ruolo iniziale in base alle regole aziendali
    const roleConfig = await RoleManagementService.determineUserRoleOnSignup(
      cleanEmail,
      registerData.role
    );

    const newUser = new User({
      name: registerData.name,
      surname: registerData.surname,
      email: cleanEmail,
      password: hashedPassword,
      role: roleConfig.role,
      roleStatus: roleConfig.roleStatus,
      requestedRole: roleConfig.requestedRole
    });

    await newUser.save();

    // Generazione Access Token e Refresh Token
    const accessToken = TokenService.generateAccessToken(newUser);
    const refreshToken = await TokenService.generateRefreshToken(newUser, ipAddress);

    return {
      user: UserMapper.toUserResponseDTO(newUser),
      accessToken,
      refreshToken
    };
  }

  /**
   * Login Utente Locale.
   */
  async loginLocalUser(email, password, ipAddress = '') {
    const cleanEmail = email.toLowerCase().trim();
    const user = await this.getUserByEmailModel(cleanEmail);

    if (!user) {
      throw new Error('Credenziali non valide.');
    }

    if (!user.password) {
      throw new Error('Questo account è stato registrato tramite Google. Effettua il login con Google.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Credenziali non valide.');
    }

    // Se l'utente era un guest ma nel frattempo ha ricevuto una student assignment, aggiorniamo il ruolo
    if (user.role === 'guest') {
      const roleConfig = await RoleManagementService.determineUserRoleOnSignup(cleanEmail, null);
      if (roleConfig.role === 'student') {
        user.role = 'student';
        user.roleStatus = 'approved';
        await user.save();
      }
    }

    const accessToken = TokenService.generateAccessToken(user);
    const refreshToken = await TokenService.generateRefreshToken(user, ipAddress);

    return {
      user: UserMapper.toUserResponseDTO(user),
      accessToken,
      refreshToken
    };
  }

  /**
   * Integrazione Google OAuth2: Cerca utente per Google ID o unifica per Email.
   */
  async findOrCreateGoogleUser(profile) {
    let user = await this.getUserByGoogleId(profile.id);
    if (user) {
      return user;
    }

    const email = profile.emails && profile.emails[0] ? profile.emails[0].value.toLowerCase().trim() : null;
    if (!email) {
      throw new Error('Nessun indirizzo email restituito dal profilo Google.');
    }

    user = await this.getUserByEmailModel(email);
    if (user) {
      user.googleId = profile.id;
      await user.save();
      return user;
    }

    const roleConfig = await RoleManagementService.determineUserRoleOnSignup(email, null);

    const newUser = new User({
      googleId: profile.id,
      email: email,
      name: profile.name && profile.name.givenName ? profile.name.givenName : (profile.displayName || 'Utente'),
      surname: profile.name && profile.name.familyName ? profile.name.familyName : 'Google',
      role: roleConfig.role,
      roleStatus: roleConfig.roleStatus,
      requestedRole: roleConfig.requestedRole
    });

    await newUser.save();
    return newUser;
  }

  /**
   * Rotazione e Rinnovo del Refresh Token.
   */
  async refreshSession(refreshTokenString, ipAddress = '') {
    const storedToken = await TokenService.verifyAndGetRefreshToken(refreshTokenString);
    if (!storedToken) {
      throw new Error('Refresh Token non valido o scaduto.');
    }

    const user = storedToken.user;
    if (!user) {
      throw new Error('Utente associato al token non trovato.');
    }

    // Rotazione: revoca il vecchio token ed emette una nuova coppia
    const newRefreshToken = await TokenService.generateRefreshToken(user, ipAddress);
    await TokenService.revokeRefreshToken(refreshTokenString, ipAddress, newRefreshToken);

    const newAccessToken = TokenService.generateAccessToken(user);

    return {
      user: UserMapper.toUserResponseDTO(user),
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  /**
   * Logout: Revoca il Refresh Token attivo.
   */
  async logout(refreshTokenString) {
    if (refreshTokenString) {
      await TokenService.revokeRefreshToken(refreshTokenString);
    }
  }

  /**
   * Restituisce il profilo dell'Utente autenticato via ID.
   */
  async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Utente non trovato.');
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
