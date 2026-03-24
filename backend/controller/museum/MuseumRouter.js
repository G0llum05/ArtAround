const express = require('express');
const MuseumController = require('./MuseumController');
const router = express.Router();

router.get('/', MuseumController.getAll);
router.post('/', MuseumController.create);

module.exports = router;
