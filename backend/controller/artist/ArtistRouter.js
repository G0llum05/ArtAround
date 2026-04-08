const express = require('express');
const ArtistController = require('./ArtistController');
const router = express.Router();

router.get('/', ArtistController.getAll);
router.post('/', ArtistController.create);

module.exports = router;
