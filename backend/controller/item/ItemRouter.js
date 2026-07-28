const express = require('express');
const ItemController = require('./ItemController');

const router = express.Router();

/* #swagger.tags = ['Item'] */

// GET lista di item
router.get('/', ItemController.getAll);

// GET item per ID
router.get('/:id', ItemController.getById);

// CREA un nuovo item
router.post('/', ItemController.create);

// AGGIORNA un item per ID
router.patch('/:id', ItemController.update);

// ELIMINA un item per ID
router.delete('/:id', ItemController.delete);

module.exports = router;
