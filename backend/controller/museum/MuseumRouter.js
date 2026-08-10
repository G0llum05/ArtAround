const express = require('express');
const MuseumController = require('./MuseumController');
const router = express.Router();

router.get('/', MuseumController.getAll);
router.get('/:id', MuseumController.getById);
// {router.get('/name')
router.get('/:id/visits', MuseumController.getVisitsByMuseumId);

router.get('/:id/visitPlan', MuseumController.getVisitPlan);
router.get('/:id/homePresentation', MuseumController.getHomePresentation);
router.post('/', MuseumController.create);
router.patch('/:id', MuseumController.update);
router.delete('/:id', MuseumController.delete);

module.exports = router;
