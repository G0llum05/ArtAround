const express = require('express');
const router = express.Router();
const UploadController = require('./UploadController');

/* #swagger.tags = ['Upload'] */

// Generic upload endpoint
router.post('/', UploadController.handleUpload);

// Museum meta upload
router.post('/museum/:museumId/meta', UploadController.handleUpload);

// Visit meta upload
router.post('/museum/:museumId/visit/:visitId/meta', UploadController.handleUpload);

// Visit artwork upload
router.post('/museum/:museumId/visit/:visitId/artwork/:artworkId', UploadController.handleUpload);

// Museum artwork upload
router.post('/museum/:museumId/artwork/:artworkId', UploadController.handleUpload);

module.exports = router;
