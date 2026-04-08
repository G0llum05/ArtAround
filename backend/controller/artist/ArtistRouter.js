const express = require('express');
const ArtistController = require('./ArtistController');
const router = express.Router();

router.get('/', ArtistController.getAll);
router.get('/:id', ArtistController.getById);
router.post('/', ArtistController.create);
router.put('/:id', ArtistController.update);
router.delete('/:id', ArtistController.delete);

module.exports = router;
