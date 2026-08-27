const express = require('express');
const GroupVisitController = require('./GroupVisitController');
const { authenticateJWT } = require('../../middleware/authMiddleware');
const { authorizeRoles } = require('../../middleware/roleMiddleware');

const router = express.Router();

/* #swagger.tags = ['Group Visit'] */

// 1. Creazione sessione (Docente/Admin)
router.post(
  '/',
  authenticateJWT,
  authorizeRoles('teacher', 'admin'),
  GroupVisitController.createSession
);

// 2. Storico sessioni gestite dal docente
router.get(
  '/my-teaching',
  authenticateJWT,
  authorizeRoles('teacher', 'admin'),
  GroupVisitController.getTeacherSessions
);

// 3. Storico sessioni a cui l'utente ha partecipato come studente
router.get(
  '/my-participations',
  authenticateJWT,
  GroupVisitController.getStudentSessions
);

// 4. Cerca sessione attiva tramite codice PIN
router.get(
  '/code/:code',
  authenticateJWT,
  GroupVisitController.getSessionByCode
);

// 5. Entra in una sessione tramite codice PIN
router.post(
  '/join',
  authenticateJWT,
  GroupVisitController.joinSession
);

// 6. Dettagli completi sessione per ID
router.get(
  '/:id',
  authenticateJWT,
  GroupVisitController.getSessionById
);

// 7. Aggiornamento progresso/tappa da parte del docente
router.patch(
  '/:id/progress',
  authenticateJWT,
  authorizeRoles('teacher', 'admin'),
  GroupVisitController.updateProgress
);

// 8. Invio domanda da parte di uno studente
router.post(
  '/:id/questions',
  authenticateJWT,
  GroupVisitController.addQuestion
);

// 9. Risposta/chiusura domanda da parte del docente
router.patch(
  '/:id/questions/:questionId',
  authenticateJWT,
  authorizeRoles('teacher', 'admin'),
  GroupVisitController.updateQuestionStatus
);

// 10. Conclusione definitiva della sessione
router.post(
  '/:id/end',
  authenticateJWT,
  authorizeRoles('teacher', 'admin'),
  GroupVisitController.endSession
);

module.exports = router;
