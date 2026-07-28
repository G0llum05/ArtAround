const express = require('express');
const MuseumController = require('./MuseumController');
const router = express.Router();

router.get('/', MuseumController.getAll);
// router.get('/name')
router.get('/:id/visits', MuseumController.getVisitsByMuseumId);
router.post('/', MuseumController.create);
router.patch('/:id', MuseumController.update);
router.delete('/:id', MuseumController.delete);

module.exports = router;