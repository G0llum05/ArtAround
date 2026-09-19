const { ResponsiveVoiceAPIClient } = require('@responsivevoice/api-client');
const Sanitizer = require('../utils/Sanitizer');
class ResponsiveVoiceService {
  constructor() {
    this.client = null;
    this.initClient();
  }

  initClient() {
    if (this.client) return this.client;

    const rvApiKey = process.env.RESPONSIVEVOICE_API_KEY;
    const rvSecret = process.env.NODE_ENV === 'production'
      ? process.env.RESPONSIVEVOICE_SECRET
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
    }
    return this.client;
  }

  getClient() {
    if (!this.client) {
      this.initClient();
    }
    return this.client;
  }

  /**
   * Mappa dinamica del codice lingua selezionato alla voce appropriata per ResponsiveVoice.
   * Gender voice: female
   * AVAILABLE_VOICES = ['it', 'en', 'fr', 'es', 'de', 'cn', 'ru'] (Sanitizer)
   */
  getVoiceForLanguage(lang = 'it') {
    const sanitizedLang = Sanitizer.sanitizeLanguage(lang);
    let voice = 'Italian Female';
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
      case 'pt':
        voice = 'Portuguese Female';
        break;
      default:
        voice = 'Italian Female';
    }
    return voice;
  }

  /**
   * Suddivide in modo robusto e completo un testo lungo in chunk di dimensione massima desiderata,
   * preservando i confini delle frasi (. ! ?), delle clausole (, ; :) o delle parole.
   * Garantisce che l'intero testo dall'inizio alla fine sia suddiviso senza perdite.
   */
  splitTextIntoChunks(text, maxChars = 350) {
    if (!text || typeof text !== 'string') return [];
    const clean = text.trim();
    if (!clean) return [];

    if (clean.length <= maxChars) {
      return [clean];
    }

    const rawSentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
    const chunks = [];
    let currentChunk = '';

    for (let sentence of rawSentences) {
      sentence = sentence.trim();
      if (!sentence) continue;

      if (sentence.length > maxChars) {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = '';
        }

        const subParts = sentence.match(/[^,;:]+[,;:]+|[^,;:]+$/g) || [sentence];
        for (let sub of subParts) {
          sub = sub.trim();
          if (!sub) continue;

          if (sub.length > maxChars) {
            const words = sub.split(/\s+/);
            for (const word of words) {
              if (!word) continue;
              if ((currentChunk + ' ' + word).trim().length <= maxChars) {
                currentChunk = (currentChunk + ' ' + word).trim();
              } else {
                if (currentChunk) chunks.push(currentChunk);
                currentChunk = word;
              }
            }
          } else {
            if ((currentChunk + ' ' + sub).trim().length <= maxChars) {
              currentChunk = (currentChunk + ' ' + sub).trim();
            } else {
              if (currentChunk) chunks.push(currentChunk);
              currentChunk = sub;
            }
          }
        }
      } else {
        if ((currentChunk + ' ' + sentence).trim().length <= maxChars) {
          currentChunk = (currentChunk + ' ' + sentence).trim();
        } else {
          if (currentChunk) chunks.push(currentChunk);
          currentChunk = sentence;
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
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
    else if (cleanLang.includes('pt')) cleanLang = 'pt';
    else if (cleanLang.includes('cn') || cleanLang.includes('zh')) cleanLang = 'zh-CN';
    else if (cleanLang.includes('ru') || cleanLang.includes('rus')) cleanLang = 'ru';
    else cleanLang = 'it';

    const cleanText = Sanitizer.cleanTextForVoice(text);
    if (!cleanText) return Buffer.alloc(0);

    // Suddivide il testo in chunk di max 150 caratteri (limite API Google) garantendo la copertura totale fino all'ultimo carattere
    const chunks = this.splitTextIntoChunks(cleanText, 150);
    console.log(`[ResponsiveVoiceService] Google TTS: elaborazione di ${chunks.length} chunk(s) (testo totale: ${cleanText.length} caratteri)`);

    const audioBuffers = await Promise.all(
      chunks.map(async (chunk, index) => {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${cleanLang}&q=${encodeURIComponent(chunk)}&textlen=${chunk.length}`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://translate.google.com/'
          }
        });

        if (!response.ok) {
          throw new Error(`Google TTS Error su chunk ${index + 1}/${chunks.length}: status ${response.status}`);
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
    const cleanedText = Sanitizer.cleanTextForVoice(text);
    if (!cleanedText) return Buffer.alloc(0);

    const client = this.getClient();
    
    if (client) {
      try {
        const voiceName = this.getVoiceForLanguage(lang);
        const chunks = this.splitTextIntoChunks(cleanedText, 350);

        console.log(`[ResponsiveVoiceService] Avvio sintesi TTS in ${chunks.length} chunk(s): voice="${voiceName}", caratteri totali: ${cleanedText.length}`);

        const audioBuffers = await Promise.all(
          chunks.map(async (chunk) => {
            const synthetizedAudio = await client.synthesize({
              text: chunk,
              voice: voiceName,
              format: 'mp3'
            });
            if (synthetizedAudio && synthetizedAudio.blob) {
              return Buffer.from(await synthetizedAudio.blob.arrayBuffer());
            }
            return Buffer.alloc(0);
          })
        );

        const finalBuffer = Buffer.concat(audioBuffers);
        if (finalBuffer && finalBuffer.length > 0) {
          console.log(`[ResponsiveVoiceService] Sintesi completa multi-chunk riuscita (${finalBuffer.length} bytes)`);
          return finalBuffer;
        }

      } catch (err) {
        console.warn('[ResponsiveVoiceService] Errore ResponsiveVoice multi-chunk:', err.message);
        console.warn('[ResponsiveVoiceService] Provo fallback Google TTS...');
      }
    } else {
      console.warn('[ResponsiveVoiceService] Client non inizializzato, uso fallback Google TTS.');
    }

    return await this.synthesizeGoogleTTS(cleanedText, lang);
  }

  /**
   * Genera la sintesi vocale e la ritorna come Base64 Data URL (data:audio/mp3;base64,...),
   * suddividendo il testo in chunk per evitare limiti di lunghezza.
   */
  async synthesizeAudioBase64(text, lang = 'it') {
    if (!text || !text.trim()) return null;

    const cleanedText = Sanitizer.cleanTextForVoice(text);
    if (!cleanedText) return null;

    const client = this.getClient();
    if (client) {
      try {
        const voiceName = this.getVoiceForLanguage(lang);
        const chunks = this.splitTextIntoChunks(cleanedText, 350);

        console.log(`[ResponsiveVoiceService] Avvio sintesi Base64 in ${chunks.length} chunk(s): voice="${voiceName}", lang="${lang}", caratteri: ${cleanedText.length}`);

        // Richiediamo l'audio per ogni chunk garantendo la copertura completa
        const audioBuffers = await Promise.all(
          chunks.map(async (chunk, index) => {
            const isLastChunk = index === chunks.length - 1;
            const synthetizedAudio = await client.synthesize({
              text: chunk,
              voice: voiceName,
              format: 'mp3'
            });
            if (synthetizedAudio && synthetizedAudio.blob) {
              const buf = Buffer.from(await synthetizedAudio.blob.arrayBuffer());
              if (isLastChunk) {
                console.log(`[ResponsiveVoiceService] Raggiunta e sintetizzata la fine del testo (Chunk finale ${index + 1}/${chunks.length})`);
              }
              return buf;
            }
            return Buffer.alloc(0);
          })
        );

        // Uniamo i buffer MP3 dei vari chunk in un unico buffer finale
        const finalBuffer = Buffer.concat(audioBuffers);
        if (finalBuffer && finalBuffer.length > 0) {
          console.log(`[ResponsiveVoiceService] Sintesi Base64 multi-chunk completata con successo (${finalBuffer.length} bytes)`);
          return `data:audio/mp3;base64,${finalBuffer.toString('base64')}`;
        }

      } catch (err) {
        console.warn('[ResponsiveVoiceService] Errore ResponsiveVoice Base64 multi-chunk:', {
          message: err.message,
          name: err.name,
          status: err.status,
          statusText: err.statusText,
          errors: err.errors,
          body: err.body
        });
        console.warn('[ResponsiveVoiceService] Provo fallback Google TTS...');
      }
    } else {
      console.warn('[ResponsiveVoiceService] Client non inizializzato (mancano API_KEY o SECRET), uso fallback Google TTS.');
    }

    try {
      const googleBuffer = await this.synthesizeGoogleTTS(cleanedText, lang);
      if (googleBuffer && googleBuffer.length > 0) {
        console.log(`[ResponsiveVoiceService] Fallback Google TTS completato con successo (${googleBuffer.length} bytes)`);
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
    const client = this.getClient();
    if (!client) {
      return { voices: [] };
    }
    return await client.getVoices(filters);
  }
}

module.exports = new ResponsiveVoiceService();
