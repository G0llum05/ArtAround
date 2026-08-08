const express = require('express');
const uploadMiddleware = require('../../middleware/uploadMiddleware');
const UploadController = require('./UploadController');

const router = express.Router();

/* #swagger.tags = ['Upload'] */

// Specific routes matching node tree structure:
// assets/museums/:museumId/meta
router.post('/museum/:museumId/meta', uploadMiddleware.any(), UploadController.handleUpload);

// assets/museums/:museumId/visit/:visitId/meta
router.post('/museum/:museumId/visits/:visitId/meta', uploadMiddleware.any(), UploadController.handleUpload);

// assets/museums/:museumId/artworks/:artworkId
router.post('/museum/:museumId/artworks/:artworkId', uploadMiddleware.any(), UploadController.handleUpload);

// assets/museums/:museumId/artists/:artistId
router.post('/museum/:museumId/artists/:artistId', uploadMiddleware.any(), UploadController.handleUpload);

// assets/users/:userId/propic/
router.post('/users/:userId/propic', uploadMiddleware.any(), UploadController.handleUpload)

// Generic upload endpoint
router.post('/', uploadMiddleware.any(), UploadController.handleUpload);

module.exports = router;
