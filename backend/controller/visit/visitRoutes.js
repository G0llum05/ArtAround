const express = require('express');
const VisitController = require('./VisitController');

const router = express.Router();

// Nota: Il prefisso '/api/visits' verrà aggiunto in server.js

// GET /
// Corrisponde a GET /api/visits/
router.get('/', VisitController.getAllVisits);

// POST /
// Corrisponde a POST /api/visits/
router.post('/', VisitController.createVisit);

module.exports = router;
