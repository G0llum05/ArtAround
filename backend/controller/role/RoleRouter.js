const express = require('express');
const roleController = require('./RoleController');
const { authenticateJWT } = require('../../middleware/authMiddleware');
const { authorizeRoles } = require('../../middleware/roleMiddleware');

const router = express.Router();

/* #swagger.tags = ['Role Management'] */

// Pre-assegnazione email studente (Accessibile a: teacher, museumstaff, admin)
router.post('/assign-student', authenticateJWT, authorizeRoles('teacher', 'museumstaff', 'admin'), (req, res) => roleController.assignStudent(req, res));

// Lista delle richieste di ruolo in sospeso (Riservato agli Admin)
router.get('/pending-requests', authenticateJWT, authorizeRoles('admin'), (req, res) => roleController.getPendingRequests(req, res));

// Approvazione richiesta di ruolo per un utente (Riservato agli Admin)
router.post('/approve/:userId', authenticateJWT, authorizeRoles('admin'), (req, res) => roleController.approveRequest(req, res));

// Rifiuto richiesta di ruolo per un utente (Riservato agli Admin)
router.post('/reject/:userId', authenticateJWT, authorizeRoles('admin'), (req, res) => roleController.rejectRequest(req, res));

module.exports = router;
