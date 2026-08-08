const { ResponsiveVoiceAPIClient } = require('@responsivevoice/api-client');
const { Sanitizer } = require('../utils/Sanitizer');
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
    const sanitizedLang = Sanitizer.sanitizedLang(lang);
    const voice = 'Italian Female';
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
      return voice;
    }
  }

  /**
   * Genera la sintesi vocale audio wav in backend tramite ResponsiveVoiceAPIClient.
   * Ritorna il Buffer audio per lo streaming HTTP al client.
   */
  async synthesizeAudioBuffer(text, lang = 'it') {
    if (!this.client) {
      throw new Error('ResponsiveVoiceAPIClient non inizializzato nel backend (verificare API_KEY e Secret).');
    }

    const voiceName = this.getVoiceForLanguage(lang);
    const trimmedText = text.trim().substring(0, 500);

    const synthetizedAudio = await this.client.synthesize({
      text: trimmedText,
      voice: voiceName,
      format: 'wav'
      // format: 'mp3'
    });

    if (!synthetizedAudio) {
      throw new Error('Nessun dato audio restituito da ResponsiveVoice');
    }

    // creo un buffer partendo dalla struttura binaria grezza (blob)
    let buffer = Buffer.from(await synthetizedAudio.blob.arrayBuffer());

    if (!buffer) {
      throw new Error('Impossibile estrarre il buffer audio dalla risposta di ResponsiveVoice');
    }

    return buffer;
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