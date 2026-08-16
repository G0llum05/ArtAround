const TokenService = require('../service/TokenService');

/**
 * middleware di autenticazione access token 
 */
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      type: 'error',
      code: 'UNAUTHORIZED',
      message: 'Accesso non autorizzato. Token JWT mancante o malformato.'
    });
  }

  const token = authHeader.split(' ')[1]; // prende il token perchè come prima stringa c'è "Bearer"
  try {
    const decodedPayload = TokenService.verifyAccessToken(token);
    req.user = decodedPayload; // aggiunge il payload decodificato alla richiesta per l'uso nei controller
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        type: 'error',
        code: 'TOKEN_EXPIRED',
        message: 'Il token JWT è scaduto. Effettua nuovamente il login per ottenere un nuovo token.'
      });
    } else {
      return res.status(401).json({
        type: 'error',
        code: 'INVALID_TOKEN',
        message: 'Il token JWT fornito non è valido.'
      });
    }
  }
}

module.exports = {
  authenticateJWT
};
