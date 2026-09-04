const express = require('express');
const uploadMiddleware = require('../../middleware/uploadMiddleware');
const UploadController = require('./UploadController');

const router = express.Router();

/* #swagger.tags = ['Upload'] */

// Specific routes matching node tree structure:
// assets/museums/:museumId/meta
router.post('/museum/:museumId/meta', uploadMiddleware.any(), UploadController.museumImgUpload);
// assets/museums/:museumId/map
router.post('/museum/:museumId/map', uploadMiddleware.any(), UploadController.museumMapImgUpload);

// assets/museums/:museumId/visit/:visitId/meta
router.post('/museum/:museumId/visit/:visitId/meta', uploadMiddleware.any(), UploadController.visitImgUpload);
router.post('/visit/:visitId/meta', uploadMiddleware.any(), UploadController.visitImgUpload);

// assets/museums/:museumId/artworks/:artworkId
router.post('/museum/:museumId/artwork/:artworkId', uploadMiddleware.any(), UploadController.artworkImgUpload);
router.post('/artwork/:artworkId', uploadMiddleware.any(), UploadController.artworkImgUpload);

// assets/artists/:artistId (Decentralized artist images)
router.post('/artist/:artistId', uploadMiddleware.any(), UploadController.artistImgUpload);

// assets/users/:userId/propic/
router.get('/user/:userId/propic', UploadController.getUserPropic);
router.post('/user/:userId/propic', uploadMiddleware.any(), UploadController.userPropicUpload);

// Generic upload endpoint
// router.post('/', uploadMiddleware.any(), UploadController.handleUpload);

module.exports = router;
