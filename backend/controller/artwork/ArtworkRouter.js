const express = require('express');
const ArtworkController = require('./ArtworkController');

const router = express.Router();

// GET /
router.get('/', ArtworkController.getAllArtworks);

// GET /:id
router.get('/:id', ArtworkController.getArtworkById);

// POST /
router.post('/', ArtworkController.createArtwork);

// PUT /:id
router.put('/:id', ArtworkController.updateArtwork);

// DELETE /:id
router.delete('/:id', ArtworkController.deleteArtwork);

module.exports = router;
