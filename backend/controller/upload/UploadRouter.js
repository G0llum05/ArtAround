const express = require('express');
const uploadMiddleware = require('../../middleware/uploadMiddleware');
const UploadController = require('./UploadController');

const router = express.Router();

/* #swagger.tags = ['Upload'] */

// Specific routes matching node tree structure:
// assets/museums/:museumId/meta
router.post('/museum/:museumId/meta', uploadMiddleware.any(), UploadController.handleUpload);

// assets/museums/:museumId/visit/:visitId/meta
router.post('/museum/:museumId/visit/:visitId/meta', uploadMiddleware.any(), UploadController.handleUpload);

// assets/museums/:museumId/visit/:visitId/:artworkId
router.post('/museum/:museumId/visit/:visitId/artwork/:artworkId', uploadMiddleware.any(), UploadController.handleUpload);

// assets/museums/:museumId/:artworkId
router.post('/museum/:museumId/artwork/:artworkId', uploadMiddleware.any(), UploadController.handleUpload);

// Generic upload endpoint
router.post('/', uploadMiddleware.any(), UploadController.handleUpload);

module.exports = router;
