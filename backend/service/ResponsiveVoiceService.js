const { ResponsiveVoiceAPIClient } = require('@responsivevoice/api-client');
const Sanitizer = require('../utils/Sanitizer');
class ResponsiveVoiceService {
  constructor() {
    this.client = null;
    this.initClient();
  }

  initClient() {
    const rvApiKey = process.env.RESPONSIVEVOICE_API_KEY;
    const rvSecret = process.env.NODE_ENV === 'production'
      ? process.env.RESPONSIVEVOICE_API_SECRET
      : process.env.RESPONSIVEVOICE_LOCAL_SECRET;

    if (rvApiKey && rvSecret) {
      try {
        this.client = new ResponsiveVoiceAPIClient({
          apiKey: rvApiKey,
          apiSecret: rvSecret
        });
        console.log('[ResponsiveVoiceService] Client ResponsiveVoiceAPIClient backend inizializzato con successo.');
      } catch (err) {
        console.warn('[ResponsiveVoiceService] Impossibile inizializzare ResponsiveVoiceAPIClient:', err.message);
      }
    } else {
      console.warn('[ResponsiveVoiceService] Credenziali ResponsiveVoice non trovate in process.env.');
    }
  }

  /**
   * Mappa dinamica del codice lingua selezionato alla voce appropriata per ResponsiveVoice.
   * Gender voice: female
   * AVAILABLE_VOICES = ['it', 'en', 'fr', 'es', 'de', 'cn', 'ru'] (Sanitizer)
   */
  getVoiceForLanguage(lang = 'it') {
    const sanitizedLang = Sanitizer.sanitizeLanguage(lang);
    switch (sanitizedLang) {
      case 'it':
        voice = 'Italian Female';
        break;
      case 'en':
        voice = 'US English Female';
        break;
      case 'fr':
        voice = 'French Female';
        break;
      case 'es':
        voice = 'Spanish Female';
        break;
      case 'de':
        voice = 'Deutsch Female';
        break;
      case 'cn':
        voice = 'Chinese Female';
        break;
      case 'ru':
        voice = 'Russian Female';
        break;
      default:
        voice = 'Italian Female';
    }
    return voice;
  }

  /**
   * Sintesi vocale tramite Google TTS (Fallback gratuito e senza API Key)
   */
  async synthesizeGoogleTTS(text, lang = 'it') {
    let cleanLang = (lang || 'it').toLowerCase();
    if (cleanLang.includes('en') || cleanLang.includes('us')) cleanLang = 'en';
    else if (cleanLang.includes('fr') || cleanLang.includes('fra')) cleanLang = 'fr';
    else if (cleanLang.includes('sp') || cleanLang.includes('es')) cleanLang = 'es';
    else if (cleanLang.includes('de')) cleanLang = 'de';
    else if (cleanLang.includes('cn') || cleanLang.includes('zh')) cleanLang = 'zh-CN';
    else if (cleanLang.includes('ru') || cleanLang.includes('rus')) cleanLang = 'ru';
    else cleanLang = 'it';

    // Rimuove markdown, a capo e caratteri speciali
    const cleanText = (text || '')
      .replace(/[\r\n]+/g, ' ')
      .replace(/[*#_~`«»]+/g, '')
      .trim();

    if (!cleanText) return Buffer.alloc(0);

    // Suddivide il testo in frasi/chunk di massimo 150 caratteri (limite API Google)
    const rawSentences = cleanText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleanText];
    const chunks = [];

    let currentChunk = '';
    for (const sentence of rawSentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;

      if ((currentChunk + ' ' + trimmedSentence).trim().length <= 150) {
        currentChunk = (currentChunk + ' ' + trimmedSentence).trim();
      } else {
        if (currentChunk) chunks.push(currentChunk);
        if (trimmedSentence.length > 150) {
          const words = trimmedSentence.split(' ');
          let subChunk = '';
          for (const w of words) {
            if ((subChunk + ' ' + w).trim().length <= 150) {
              subChunk = (subChunk + ' ' + w).trim();
            } else {
              if (subChunk) chunks.push(subChunk);
              subChunk = w;
            }
          }
          currentChunk = subChunk;
        } else {
          currentChunk = trimmedSentence;
        }
      }
    }
    if (currentChunk) chunks.push(currentChunk);

    const limitedChunks = chunks.slice(0, 6);

    const audioBuffers = await Promise.all(
      limitedChunks.map(async (chunk) => {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${cleanLang}&q=${encodeURIComponent(chunk)}&textlen=${chunk.length}`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://translate.google.com/'
          }
        });

        if (!response.ok) {
          throw new Error(`Google TTS Error: status ${response.status}`);
        }

        const audioArrayBuffer = await response.arrayBuffer();
        return Buffer.from(audioArrayBuffer);
      })
    );

    return Buffer.concat(audioBuffers);
  }

  /**
   * Genera la sintesi vocale audio wav/mp3 in backend.
   * Ritorna il Buffer audio.
   */
  async synthesizeAudioBuffer(text, lang = 'it') {
    if (this.client) {
      try {
        const voiceName = this.getVoiceForLanguage(lang);
        const trimmedText = text.trim().substring(0, 500);

        const synthetizedAudio = await this.client.synthesize({
          text: trimmedText,
          voice: voiceName,
          format: 'wav'
        });

        if (synthetizedAudio) {
          const buffer = Buffer.from(await synthetizedAudio.blob.arrayBuffer());
          if (buffer && buffer.length > 0) return buffer;
        }
      } catch (err) {
        console.warn('[ResponsiveVoiceService] ResponsiveVoice non riuscito, provo fallback Google TTS:', err.message);
      }
    }

    return await this.synthesizeGoogleTTS(text, lang);
  }

  /**
   * Genera la sintesi vocale e la ritorna come Base64 Data URL (data:audio/wav;base64,... o data:audio/mp3;base64,...).
   */
  async synthesizeAudioBase64(text, lang = 'it') {
    if (!text || !text.trim()) return null;

    if (this.client) {
      try {
        const voiceName = this.getVoiceForLanguage(lang);
        const trimmedText = text.trim().substring(0, 500);

        const synthetizedAudio = await this.client.synthesize({
          text: trimmedText,
          voice: voiceName,
          format: 'wav'
        });

        if (synthetizedAudio) {
          const buffer = Buffer.from(await synthetizedAudio.blob.arrayBuffer());
          if (buffer && buffer.length > 0) {
            return `data:audio/wav;base64,${buffer.toString('base64')}`;
          }
        }
      } catch (err) {
        console.warn('[ResponsiveVoiceService] Errore ResponsiveVoice, provo fallback Google TTS:', err.message);
      }
    }

    try {
      const googleBuffer = await this.synthesizeGoogleTTS(text, lang);
      if (googleBuffer && googleBuffer.length > 0) {
        return `data:audio/mp3;base64,${googleBuffer.toString('base64')}`;
      }
    } catch (gErr) {
      console.warn('[ResponsiveVoiceService] Errore fallback Google TTS:', gErr.message);
    }

    return null;
  }

  /**
   * Ottiene la lista di voci disponibili da ResponsiveVoice in backend.
   */
  async getVoices(filters = {}) {
    if (!this.client) {
      return { voices: [] };
    }
    return await this.client.getVoices(filters);
  }
}

module.exports = new ResponsiveVoiceService();
