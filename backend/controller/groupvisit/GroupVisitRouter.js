const express = require('express');
const GroupVisitController = require('./GroupVisitController');
const { authenticateJWT } = require('../../middleware/authMiddleware');
const { authorizeRoles } = require('../../middleware/roleMiddleware');

const router = express.Router();

/* #swagger.tags = ['Group Visit'] */

// Creazione gruppo (Teacher / Admin)
router.post(
  '/',
  authenticateJWT,
  authorizeRoles('teacher', 'admin'),
  GroupVisitController.createSession
);

// Entra in una sessione tramite codice PIN
router.post(
  '/join',
  authenticateJWT,
  GroupVisitController.joinSession
);

// Esce da una sessione
router.post(
  '/leave',
  authenticateJWT,
  GroupVisitController.leaveSession
);

// Cerca sessione attiva tramite codice PIN
router.get(
  '/code/:code',
  authenticateJWT,
  GroupVisitController.getSessionByCode
);

module.exports = router;
