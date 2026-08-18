const express = require('express');
const VisitController = require('./VisitController');

const router = express.Router();

// Nota: Il prefisso '/api/visits' verrà aggiunto in server.js

// GET /
// Corrisponde a GET /api/visits/
router.get('/', VisitController.getAllVisits);

// GET /feed
// Restituisce le sezioni del marketplace raggruppate per categoria (solo quelle non vuote)
router.get('/feed', VisitController.getMarketplaceFeed);

// POST /:id/like
router.post('/:id/like', VisitController.likeVisit);

// POST /:id/view
router.post('/:id/view', VisitController.viewVisit);

// GET /:id/homePresentation
router.get('/homePresentation', VisitController.getVisitHomePresentation);

// POST /
// Corrisponde a POST /api/visits/
router.post('/', VisitController.createVisit);



module.exports = router;
