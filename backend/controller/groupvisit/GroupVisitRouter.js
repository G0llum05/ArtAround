const express = require('express');
const GroupVisitController = require('./GroupVisitController');
const { authenticateJWT } = require('../../middleware/authMiddleware');
const { authorizeRoles } = require('../../middleware/roleMiddleware');

const router = express.Router();

/* #swagger.tags = ['Group Visit'] */

// creazione gruppo
router.post('/',
  authenticateJWT,
  authorizeRoles('teacher', 'admin'),
  GroupVisitController.createSession
);


// entra in una sessione tramite codice PIN
router.post(
  '/join',
  authenticateJWT,
  GroupVisitController.joinSession
);

// esce da una sessione
router.post(
  '/leave',
  authenticateJWT,
  GroupVisitController.leaveSession
);


// dettagli completi sessione per ID
router.get(
  '/:id',
  authenticateJWT,
  GroupVisitController.getSessionById
);


// conclusione definitiva della sessione
router.post(
  '/:id/end',
  authenticateJWT,
  authorizeRoles('teacher', 'admin'),
  GroupVisitController.endSession
);



// TODO CHECK futuro
// aggiornamento progresso/tappa da parte del docente
router.patch(
  '/:id/progress',
  authenticateJWT,
  authorizeRoles('teacher', 'admin'),
  GroupVisitController.updateProgress
);

// TODO CHECK futuro
// invio domanda da parte di uno studente
router.post(
  '/:id/questions',
  authenticateJWT,
  GroupVisitController.addQuestion
);

// TODO CHECK futuro
// risposta/chiusura domanda da parte del docente
router.patch(
  '/:id/questions/:questionId',
  authenticateJWT,
  authorizeRoles('teacher', 'admin'),
  GroupVisitController.updateQuestionStatus
);

// TODO CHECK futuro
// storico sessioni gestite dal docente
router.get('/my-teaching',
  authenticateJWT,
  authorizeRoles('teacher', 'admin'),
  GroupVisitController.getTeacherSessions
);

// TODO CHECK futuro
// storico sessioni a cui l'utente ha partecipato come studente
router.get(
  '/my-participations',
  authenticateJWT,
  GroupVisitController.getStudentSessions
);

// TODO CHECK futuro
// cerca sessione attiva tramite codice PIN
router.get(
  '/code/:code',
  authenticateJWT,
  GroupVisitController.getSessionByCode
);


module.exports = router;
