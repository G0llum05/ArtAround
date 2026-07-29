const TokenService = require('../service/TokenService');

/**
 * Middleware di Autenticazione JWT.
 * Estrae l'Access Token dall'header 'Authorization: Bearer <token>', lo verifica
 * e allega i dati dell'utente a req.user.
 */
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Accesso non autorizzato. Token JWT mancante o malformato.'
    });
  }

  const token = authHeader.split(' ')[1];
  const decodedPayload = TokenService.verifyAccessToken(token);

  if (!decodedPayload) {
    return res.status(401).json({
      message: 'Access Token non valido o scaduto. Effettua il refresh o effettua nuovamente il login.'
    });
  }

  req.user = decodedPayload;
  next();
}

/**
 * Middleware opzionale: estrae l'utente se il token è presente, ma non blocca se manca.
 */
function optionalJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decodedPayload = TokenService.verifyAccessToken(token);
    if (decodedPayload) {
      req.user = decodedPayload;
    }
  }

  next();
}

module.exports = {
  authenticateJWT,
  optionalJWT
};
