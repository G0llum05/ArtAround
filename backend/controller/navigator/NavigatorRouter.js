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
* - post, navigator completo <- prende audio, trascrive, invia a GPT, riceve risposta testuale e audio
* - post, navigator senza audio <- prende testo, invia a GPT, riceve risposta testuale e audio
*/

// Endpoint completo per i comandi navigatore
// router.post('/command', upload.single('audio'), NavigatorController.handleCommand);
router.post('/navigator', upload.single('audio'), NavigatorController.navigatorHandler);

// trascrizione STT 
router.post('/stt', upload.single('audio'), NavigatorController.transcribeAudio);

// sintesi TTS
router.get('/tts', NavigatorController.streamTTS);
router.post('/tts', NavigatorController.streamTTS);

module.exports = router;
