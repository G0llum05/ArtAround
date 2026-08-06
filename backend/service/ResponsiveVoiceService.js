const { ResponsiveVoiceAPIClient } = require('@responsivevoice/api-client');

class ResponsiveVoiceService {
  constructor() {
    this.client = null;
    this.initClient();
  }

  initClient() {
    const rvApiKey = process.env.RESPONSIVEVOICE_API_KEY;
    const isProd = process.env.NODE_ENV === 'production';
    const rvSecret = isProd
      ? (process.env.RESPONSIVEVOICE_PROD_SECRET || process.env.RESPONSIVEVOICE_API_SECRET)
      : (process.env.RESPONSIVEVOICE_LOCAL_SECRET || process.env.RESPONSIVEVOICE_API_SECRET);

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
   */
  getVoiceForLanguage(lang = 'it', gender = 'female') {
    const cleanLang = (lang || 'it').toLowerCase().replace('_', '-');

    if (cleanLang.startsWith('it')) {
      return gender === 'male' ? 'Italian Male' : 'Italian Female';
    } else if (cleanLang.startsWith('en')) {
      if (cleanLang.includes('us')) {
        return gender === 'male' ? 'US English Male' : 'US English Female';
      }
      return gender === 'male' ? 'UK English Male' : 'UK English Female';
    } else if (cleanLang.startsWith('es') || cleanLang.startsWith('sp')) {
      return gender === 'male' ? 'Spanish Male' : 'Spanish Female';
    } else if (cleanLang.startsWith('fr') || cleanLang.startsWith('fra')) {
      return gender === 'male' ? 'French Male' : 'French Female';
    } else if (cleanLang.startsWith('de')) {
      return gender === 'male' ? 'Deutsch Male' : 'Deutsch Female';
    } else if (cleanLang.startsWith('zh') || cleanLang.startsWith('cn')) {
      return gender === 'male' ? 'Chinese Male' : 'Chinese Female';
    } else if (cleanLang.startsWith('ru') || cleanLang.startsWith('rus')) {
      return gender === 'male' ? 'Russian Male' : 'Russian Female';
    } else if (cleanLang.startsWith('ja')) {
      return gender === 'male' ? 'Japanese Male' : 'Japanese Female';
    }

    return gender === 'male' ? 'Italian Male' : 'Italian Female';
  }

  /**
   * Genera la sintesi vocale audio MP3 in backend tramite ResponsiveVoiceAPIClient.
   * Ritorna il Buffer audio per lo streaming HTTP al client.
   */
  async synthesizeAudioBuffer(text, lang = 'it', gender = 'female') {
    if (!this.client) {
      throw new Error('ResponsiveVoiceAPIClient non inizializzato nel backend (verificare API_KEY e Secret).');
    }

    const voiceName = this.getVoiceForLanguage(lang, gender);
    const trimmedText = text.trim().substring(0, 500);

    const audioRes = await this.client.synthesize({
      text: trimmedText,
      voice: voiceName,
      format: 'mp3'
    });

    if (!audioRes) {
      throw new Error('Nessun dato audio restituito da ResponsiveVoice');
    }

    let buffer = null;
    if (audioRes.blob && typeof audioRes.blob.arrayBuffer === 'function') {
      buffer = Buffer.from(await audioRes.blob.arrayBuffer());
    } else if (audioRes.buffer) {
      buffer = Buffer.from(audioRes.buffer);
    }

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