const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../data/model/RefreshToken');

const JWT_SECRET = process.env.JWT_SECRET || 'artaround_super_secret_jwt_key_2026';
const ACCESS_TOKEN_EXPIRATION = '15m'; // Access Token a breve durata
const REFRESH_TOKEN_DAYS = 7;

class TokenService {
  /**
   * Genera un Access Token JWT firmato a breve durata.
   */
  generateAccessToken(user) {
    const payload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      roleStatus: user.roleStatus
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });
  }

  /**
   * Verifica la validità di un Access Token JWT.
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  /**
   * Genera ed emette un nuovo Refresh Token persistito a DB.
   */
  async generateRefreshToken(user, ipAddress = '') {
    const randomToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

    const refreshToken = new RefreshToken({
      user: user._id,
      token: randomToken,
      expiresAt: expiresAt,
      createdByIp: ipAddress
    });

    await refreshToken.save();
    return randomToken;
  }

  /**
   * Verifica l'esistenza e la validità di un Refresh Token nel Database.
   */
  async verifyAndGetRefreshToken(tokenString) {
    if (!tokenString) return null;

    const refreshToken = await RefreshToken.findOne({ token: tokenString }).populate('user');
    if (!refreshToken || !refreshToken.isActive) {
      return null;
    }
    return refreshToken;
  }

  /**
   * Invalida (revoca) un singolo Refresh Token.
   */
  async revokeRefreshToken(tokenString, ipAddress = '', replacedByToken = null) {
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
   * Revoca tutti i Refresh Token attivi relativi a un determinato Utente.
   */
  async revokeAllUserTokens(userId) {
    await RefreshToken.updateMany(
      { user: userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );
  }
}

module.exports = new TokenService();
