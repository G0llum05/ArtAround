const express = require('express');
const multer = require('multer');
const NavigatorController = require('./NavigatorController');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max limit for audio clip
});

/* #swagger.tags = ['Navigator'] */

// Endpoint trascrizione STT audio (MediaRecorder -> Express -> Groq STT)
router.post('/stt', upload.single('audio'), NavigatorController.transcribeAudio);
router.post('/transcribe', upload.single('audio'), NavigatorController.transcribeAudio);

// Endpoint completo per i comandi navigatore
router.post('/command', upload.single('audio'), NavigatorController.handleCommand);

module.exports = router;
