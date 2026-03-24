const express = require('express');
const OperaMakerController = require('./OperaMakerController');
const router = express.Router();

router.get('/', OperaMakerController.getAll);
router.post('/', OperaMakerController.create);

module.exports = router;
