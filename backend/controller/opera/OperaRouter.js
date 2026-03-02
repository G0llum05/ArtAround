const express = require('express');
const OperaController = require('./OperaController');

const router = express.Router();

// GET /
router.get('/', OperaController.getAllOperas);

// POST /
router.post('/', OperaController.createOpera);

module.exports = router;
