const express = require('express');
const multer = require('multer');
const NavigatorController = require('./NavigatorController');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max limit for audio clip
});

/* #swagger.tags = ['Navigator'] */

/**
* endp necessari:
* - post, navigator completo sia con che senza audio
*/

// Endpoint completo per i comandi navigatore
router.post('/', upload.single('audio'), NavigatorController.navigatorHandler);
router.post('/navigator', upload.single('audio'), NavigatorController.navigatorHandler);

// sintesi TTS
router.get('/tts', NavigatorController.streamTTS);
router.post('/tts', NavigatorController.streamTTS);

module.exports = router;

