const GroqSTTService = require('../../service/GroqSTTService');
const NavigatorService = require('../../service/NavigatorService');
const ResponsiveVoiceService = require('../../service/ResponsiveVoiceService');
const NavigatorMapper = require('../../data/mapper/NavigatorMapper');

// TODO GLOBALE -> DTO di req e res per TUTTI i metodi


class NavigatorController {

  static async navigatorHandler(req, res) {
    /* #swagger.tags = ['Navigator']
       #swagger.summary = 'Gestisce le richieste del navigatore (trascrizione, comando, TTS)'
    */
    // header per streaming NDJSON (newline-delimited JSON) per avere la connessione persistente e inviare più chunk di risposta in tempo reale
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

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
      const textToSpeak = typeof result === 'string' ? result : (result?.text || result?.description || '');
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
      res.write(JSON.stringify({
        type: 'ERROR',
        success: false,
        error: err.message || 'Errore durante l\'elaborazione'
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

      // // 2. Fallback a Google TTS service
      // let cleanLang = (lang || 'it').toLowerCase();
      // if (cleanLang.includes('en') || cleanLang.includes('us')) cleanLang = 'en';
      // else if (cleanLang.includes('fr') || cleanLang.includes('fra')) cleanLang = 'fr';
      // else if (cleanLang.includes('sp') || cleanLang.includes('es')) cleanLang = 'es';
      // else if (cleanLang.includes('de')) cleanLang = 'de';
      // else if (cleanLang.includes('cn') || cleanLang.includes('zh')) cleanLang = 'zh-CN';
      // else if (cleanLang.includes('ru') || cleanLang.includes('rus')) cleanLang = 'ru';
      // else cleanLang = 'it';
      //
      // const trimmedText = text.trim().substring(0, 300);
      //
      // const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(trimmedText)}&tl=${cleanLang}&client=tw-ob`;
      //
      // const response = await fetch(googleTtsUrl, {
      //   headers: {
      //     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      //   }
      // });

      // if (!response.ok) {
      //   throw new Error(`Google TTS Service Error: status ${response.status}`);
      // }

      // const audioArrayBuffer = await response.arrayBuffer();
      // const audioBuffer = Buffer.from(audioArrayBuffer);
      //
      // res.setHeader('Content-Type', 'audio/mpeg');
      // res.setHeader('Content-Length', audioBuffer.length);
      // res.setHeader('Cache-Control', 'public, max-age=86400');
      // return res.send(audioBuffer);
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
