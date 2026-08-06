const GroqSTTService = require('../../service/GroqSTTService');
const NavigatorService = require('../../service/NavigatorService');
const ResponsiveVoiceService = require('../../service/ResponsiveVoiceService');


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

      // Esegue sempre NavigatorService per elaborare l'intent e generare la risposta del Chatbot
      const navResult = await NavigatorService.handleUserCommand({
        inputText,
        visitId,
        currentArtworkIndex,
        currentTone,
        currentLanguage: lang
      });
      result = { ...result, ...navResult };

      const totalBackendMs = Date.now() - startTime;
      const reply = result.spokenResponse || result.narrativeText || (result.item ? result.item.description : null) || result.actionMessage || inputText;

      return res.json({
        success: true,
        text: inputText,
        reply,
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

      // 1. Tenta sintesi sicura backend via ResponsiveVoiceService
      try {
        const audioBuffer = await ResponsiveVoiceService.synthesizeAudioBuffer(text, lang);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', audioBuffer.length);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(audioBuffer);
      } catch (rvErr) {
        console.warn('[NavigatorController] ResponsiveVoiceService TTS warning, fallback a Google TTS:', rvErr.message);
      }

      // 2. Fallback a Google TTS service
      let cleanLang = (lang || 'it').toLowerCase();
      if (cleanLang.includes('en') || cleanLang.includes('us')) cleanLang = 'en';
      else if (cleanLang.includes('fr') || cleanLang.includes('fra')) cleanLang = 'fr';
      else if (cleanLang.includes('sp') || cleanLang.includes('es')) cleanLang = 'es';
      else if (cleanLang.includes('de')) cleanLang = 'de';
      else if (cleanLang.includes('cn') || cleanLang.includes('zh')) cleanLang = 'zh-CN';
      else if (cleanLang.includes('ru') || cleanLang.includes('rus')) cleanLang = 'ru';
      else cleanLang = 'it';

      const trimmedText = text.trim().substring(0, 300);

      const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(trimmedText)}&tl=${cleanLang}&client=tw-ob`;

      const response = await fetch(googleTtsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Google TTS Service Error: status ${response.status}`);
      }

      const audioArrayBuffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(audioArrayBuffer);

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', audioBuffer.length);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(audioBuffer);
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
