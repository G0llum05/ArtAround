const GroqSTTService = require('../../service/GroqSTTService');
const NavigatorService = require('../../service/NavigatorService');
const ResponsiveVoiceService = require('../../service/ResponsiveVoiceService');
const NavigatorMapper = require('../../data/mapper/NavigatorMapper');
const Sanitizer = require('../../utils/Sanitizer');
const NavigatorMessages = require('../../utils/NavigatorMessages');

class NavigatorController {

  static async navigatorHandler(req, res) {
    /* #swagger.tags = ['Navigator']
       #swagger.summary = 'Gestisce le richieste del navigatore (trascrizione, comando, TTS)'
    */
    // header per streaming NDJSON (newline-delimited JSON) per avere la connessione persistente e inviare più chunk di risposta in tempo reale
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Cache-Control', 'no-cache');
    // res.setHeader('Connection', 'keep-alive');

    try {
      console.log('[NavigatorController] Received request:', req.body);
      const requestDTO = NavigatorMapper.toNavigatorRequestDTO(req);

      const onTranscription = async (transcribedText) => {
        res.write(JSON.stringify({
          type: 'TRANSCRIPTION',
          success: true,
          text: transcribedText
        }) + '\n');
      };

      const result = await NavigatorService.navigatorHandler({
        ...requestDTO,
        onTranscription
      });

      let audioBase64 = null;
      const rawText = typeof result === 'string' ? result : (result?.text || result?.description || '');
      const textToSpeak = Sanitizer.cleanTextForVoice(rawText);
      if (textToSpeak) {
        try {
          audioBase64 = await ResponsiveVoiceService.synthesizeAudioBase64(textToSpeak, requestDTO?.language || 'it');
        } catch (ttsErr) {
          console.warn('[NavigatorController] Errore generazione audio TTS:', ttsErr.message);
        }
      }

      const responseDTO = NavigatorMapper.toNavigatorResponseDTO(result, audioBase64);

      res.write(JSON.stringify({
        type: 'FINAL_RESPONSE',
        success: true,
        data: responseDTO
      }) + '\n');

      res.end();
    } catch (err) {
      console.error('[NavigatorController Error]:', err);
      const lang = req.body?.language || 'it';
      const userFacingError = NavigatorMessages.getMessage('generic_error', lang);
      let audioBase64 = null;
      try {
        audioBase64 = await ResponsiveVoiceService.synthesizeAudioBase64(userFacingError, lang);
      } catch (ttsErr) {
        console.warn('[NavigatorController] Errore generazione audio TTS per errore:', ttsErr.message);
      }
      res.write(JSON.stringify({
        type: 'ERROR',
        success: false,
        error: userFacingError,
        data: {
          text: userFacingError,
          audio: audioBase64
        },
        technicalDetails: err.message
      }) + '\n');
      res.end();
    }
  }


  /**
   * Genera e invia lo stream audio MP3 (TTS) dal backend Express.
   * GET /api/navigator/tts?text=...&lang=it
   * POST /api/navigator/tts
   */
  static async streamTTS(req, res) {
    /* #swagger.tags = ['Navigator']
       #swagger.summary = 'Sintesi vocale TTS Backend (MP3 Audio Stream)'
    */
    try {
      const text = req.query.text || req.body?.text;
      const lang = req.query.lang || req.body?.language || NavigatorController._extractLanguage(req);

      if (!text || !text.trim()) {
        return res.status(400).json({ success: false, error: 'Parametro text mancante.' });
      }

      try {
        const audioBuffer = await ResponsiveVoiceService.synthesizeAudioBuffer(text, lang);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', audioBuffer.length);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(audioBuffer);
      } catch (rvErr) {
        console.warn('[NavigatorController] ResponsiveVoiceService TTS warning, fallback a Google TTS:', rvErr.message);
      }

    } catch (err) {
      console.error('[NavigatorController TTS Error]:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Errore durante la generazione dell\'audio TTS'
      });
    }
  }
}

module.exports = NavigatorController;
