/**
 * Helper Enterprise per la gestione sicura dei Cookie HTTP-Only.
 */

const REFRESH_TOKEN_COOKIE_NAME = 'artaround_refreshToken';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function setRefreshTokenCookie(res, refreshToken) {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: true,                                      // Previene l'accesso lato client tramite JavaScript (XSS)
    secure: isProduction,                                // Invia solo su HTTPS in produzione
    sameSite: 'lax',                                  // Protezione da attacchi CSRF
    maxAge: SEVEN_DAYS_MS,                               // Durata di 7 giorni
    path: '/api/auth'                                    // Il cookie viene inviato solo per le rotte auth
  });
}

function clearRefreshTokenCookie(res) {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/api/auth'
  });
}

function getRefreshTokenFromCookie(req) {
  return req.cookies ? req.cookies[REFRESH_TOKEN_COOKIE_NAME] : null;
}

module.exports = {
  REFRESH_TOKEN_COOKIE_NAME,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  getRefreshTokenFromCookie
};
