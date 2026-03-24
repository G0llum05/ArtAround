const express = require('express');
const OperaController = require('./OperaController');

const router = express.Router();

// GET /
router.get('/', OperaController.getAllOperas);

// GET /:id
router.get('/:id', OperaController.getOperaById);

// POST /
router.post('/', OperaController.createOpera);

// PUT /:id
router.put('/:id', OperaController.updateOpera);

// DELETE /:id
router.delete('/:id', OperaController.deleteOpera);

module.exports = router;
