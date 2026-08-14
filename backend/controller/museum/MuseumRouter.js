const express = require('express');
const MuseumController = require('./MuseumController');
const router = express.Router();

router.get('/homePresentation', MuseumController.getHomePresentation);
router.get('/homePresentation', MuseumController.getHomePresentation);
router.get('/', MuseumController.getAll);
router.post('/', MuseumController.create);

router.get('/:id', MuseumController.getById);
// {router.get('/name')
router.get('/:id/visits', MuseumController.getVisitsPresentationByMuseumId);
router.get('/:id/visitPlan', MuseumController.getVisitPlan);
router.patch('/:id', MuseumController.update);
router.delete('/:id', MuseumController.delete);

module.exports = router;
