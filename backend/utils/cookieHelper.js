const REFRESH_TOKEN_COOKIE_NAME = 'artaround_refreshToken';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function setRefreshTokenCookie(res, refreshToken) {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: true, // no js lato client (XSS)
    secure: isProduction, // solo HTTPS in produzione
    sameSite: 'lax', // protezione attacchi CSRF (no cross-site request forgery)
    maxAge: SEVEN_DAYS_MS, // durata cookie 7 giorni
    path: '/api/auth' // uniche rotte di invio
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
