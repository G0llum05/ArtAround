/**
 * permette l'accesso solo agli utenti con ruolo inlcuso nei ruole concessi (definiti negli specifi endpoints)
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        type: 'error',
        message: 'Non autenticato. Effettua prima il login.'
      });
    }

    const { role, roleStatus } = req.user;

    // utente con ruolo non consentito
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        type: 'error',
        message: `Accesso negato. Questa operazione richiede più privilegi.`
      });
    }

    // ruolo sarebbe incluso ma richiede ancora approvazione
    if (roleStatus === 'pending' && role !== 'admin' && role !== 'guest') {
      return res.status(403).json({
        type: 'error',
        message: 'Il tuo ruolo è in attesa di approvazione da parte di un Amministratore.'
      });
    }

    next();
  };
}

module.exports = {
  authorizeRoles
};
