/**
 * Middleware di Controllo Accessi basato sui Ruoli (RBAC).
 * Permette l'accesso solo agli utenti autenticati il cui ruolo figura in allowedRoles.
 * 
 * Esempio d'uso nelle rotte:
 * router.post('/artworks', authenticateJWT, authorizeRoles('admin', 'museumstaff'), controller.create);
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Non autenticato. Effettua prima il login.'
      });
    }

    const { role, roleStatus } = req.user;

    // Se l'utente ha una richiesta di ruolo in sospeso e non è un ruolo consentito
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        message: `Accesso negato. Questa operazione richiede uno dei seguenti ruoli: [${allowedRoles.join(', ')}]. Il tuo ruolo attuale è '${role}'.`
      });
    }

    // Se il ruolo dell'utente richiede approvazione ed è ancora pending
    if (roleStatus === 'pending' && role !== 'admin' && role !== 'guest') {
      return res.status(403).json({
        message: 'Il tuo ruolo è in attesa di approvazione da parte di un Amministratore.'
      });
    }

    next();
  };
}

module.exports = {
  authorizeRoles
};
