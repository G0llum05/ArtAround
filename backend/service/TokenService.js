const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const MapperRefreshToken = require('../mapper/RefreshTokenMapper');
const RefreshToken = require('../model/RefreshToken');

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRATION = '15m';
const REFRESH_TOKEN_DAYS = 7;

class TokenService {
  /**
    * crea access token
    */
  generateAccessToken(user) {
    const payload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION }); // la libreria aggiunge timestamp e exp di scadenza automaticamente
  }


  /**
    * verifica access token e restituisce contenuto
    */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET); // la funzione fa: - divide il token in header, payload e signature - decodifica il payload - controlla scadenza - verifica firma - ritorna il payload decodificato
    } catch (error) {
      return error
    }
  }


  /**
    * crea refresh token
    */
  async generateRefreshToken(user, ipAddress) {
    const randomToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

    const refreshToken = MapperRefreshToken.toRefreshTokenModel(randomToken, user._id, ipAddress, expiresAt);

    await refreshToken.save();
    return randomToken;
  }


  /**
    * verifica esistenza e validità refresh token da db
    */
  async verifyAndGetRefreshToken(token) {
    if (!token) return null;

    const refreshToken = await RefreshToken.findOne({ token: token }).populate('userId');
    if (!refreshToken || refreshToken.expiresAt < new Date() || refreshToken.isRevoked) {
      return null;
    }
    return refreshToken;
  }


  /**
    * invalida (revoca) un singolo refresh token.
    */
  async revokeRefreshToken(tokenString, replacedByToken = null) {
    const refreshToken = await RefreshToken.findOne({ token: tokenString });
    if (!refreshToken) return;

    refreshToken.isRevoked = true;
    refreshToken.revokedAt = new Date();
    if (replacedByToken) {
      refreshToken.replacedByToken = replacedByToken;
    }
    await refreshToken.save();
  }


  /**
    * revoca tutti i refresh token di un utente.
    */
  async revokeAllUserTokens(userId) {
    await RefreshToken.updateMany(
      { user: userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );
  }


  /**
    * revoca i refresh token di un indirizzo ip dell'utente
    */
  async revokeAllUserTokensFromIp(userId, ipAddress) {
    await RefreshToken.updateMany(
      { userId: userId, createdByIp: ipAddress, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );
  }
}

module.exports = new TokenService();
