const GroqSTTService = require('../../service/GroqSTTService');
const NavigatorService = require('../../service/NavigatorService');

class NavigatorController {
  /**
   * Helper per estrarre il codice lingua dai cookie di sessione, dagli header o dal body.
   */
  static _extractLanguage(req) {
    return (
      req.cookies?.lang ||
      req.cookies?.language ||
      req.headers['x-language'] ||
      req.body?.language ||
      req.query?.lang ||
      'it'
    );
  }

  /**
   * Trascrive l'audio inviato dal client tramite Groq STT (Whisper API via groq-sdk)
   * POST /api/navigator/stt
   * POST /api/navigator/transcribe
   * POST /api/transcribe
   */
  static async transcribeAudio(req, res) {
    /* #swagger.tags = ['Navigator']
       #swagger.summary = 'Trascrive un file audio via Groq STT (Whisper)'
       #swagger.consumes = ['multipart/form-data']
       #swagger.parameters['audio'] = {
          in: 'formData',
          type: 'file',
          required: true,
          description: 'File audio registrato (webm, ogg, mp4, wav)'
       }
    */
    const startTime = Date.now();
    try {
      if (!req.file && !req.files) {
        return res.status(400).json({ success: false, error: 'Nessun file audio inviato.' });
      }

      const file = req.file || (req.files && req.files[0]);
      if (!file || !file.buffer || file.buffer.length === 0) {
        return res.status(400).json({ success: false, error: 'Il buffer del file audio è vuoto.' });
      }

      const lang = NavigatorController._extractLanguage(req);

      const sttResult = await GroqSTTService.transcribe(file.buffer, {
        filename: file.originalname || 'recording.webm',
        mimeType: file.mimetype || 'audio/webm',
        language: lang
      });

      const totalBackendMs = Date.now() - startTime;

      return res.json({
        success: true,
        text: sttResult.text,
        reply: sttResult.text,
        sttProcessMs: sttResult.processTimeMs,
        totalBackendMs,
        audioSizeBytes: sttResult.audioSizeBytes
      });
    } catch (err) {
      console.error('[NavigatorController STT Error]:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Errore durante la trascrizione audio'
      });
    }
  }

  /**
   * Processa un comando vocale o testuale completo per il navigatore della visita
   * POST /api/navigator/command
   */
  static async handleCommand(req, res) {
    /* #swagger.tags = ['Navigator']
       #swagger.summary = 'Elabora comando vocale/testuale del navigatore'
    */
    const startTime = Date.now();
    try {
      let inputText = req.body.inputText || '';
      let sttProcessMs = 0;
      const lang = NavigatorController._extractLanguage(req);

      // Se viene allegato un audio, trascrivi prima via Groq STT
      if (req.file) {
        const sttResult = await GroqSTTService.transcribe(req.file.buffer, {
          filename: req.file.originalname || 'recording.webm',
          mimeType: req.file.mimetype || 'audio/webm',
          language: lang
        });
        inputText = sttResult.text;
        sttProcessMs = sttResult.processTimeMs;
      }

      if (!inputText) {
        return res.status(400).json({
          success: false,
          error: 'Nessun testo o audio decodificabile fornito.'
        });
      }

      const visitId = req.body.visitId;
      const currentArtworkIndex = parseInt(req.body.currentArtworkIndex || 0, 10);
      const currentTone = req.body.currentTone || 'medium';

      let result = { transcribedText: inputText };

      // Se abbiamo un visitId valido, esegui il NavigatorService
      if (visitId) {
        const navResult = await NavigatorService.handleUserCommand({
          inputText,
          visitId,
          currentArtworkIndex,
          currentTone
        });
        result = { ...result, ...navResult };
      }

      const totalBackendMs = Date.now() - startTime;

      return res.json({
        success: true,
        text: inputText,
        reply: result.spokenResponse || result.narrativeText || inputText,
        sttProcessMs,
        totalBackendMs,
        result
      });
    } catch (err) {
      console.error('[NavigatorController Command Error]:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Errore elaborazione comando navigatore'
      });
    }
  }
}

module.exports = NavigatorController;
