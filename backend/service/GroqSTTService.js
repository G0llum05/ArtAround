const { Groq, toFile } = require('groq-sdk');

/**
 * GroqSTTService - Integration with Groq API Speech-To-Text using official `groq-sdk`.
 * 
 * Features:
 * - RAM-only buffer processing (Zero Disk I/O using toFile)
 * - Zero native C++/Python dependencies
 * - Ultra-low latency (~150-250ms) using temperature: 0.0
 * - Multi-language support via session cookies / parameters
 */
class GroqSTTService {
  /**
   * Normalizes various language parameter strings (e.g. 'it', 'en/us', 'cn', 'rus', 'fra', 'sp')
   * into standard ISO 639-1 2-letter language codes supported by Groq Whisper STT.
   */
  static normalizeLanguageCode(rawLang) {
    if (!rawLang || typeof rawLang !== 'string') return 'it';
    const clean = rawLang.toLowerCase().trim();

    if (clean.includes('it')) return 'it';
    if (clean.includes('en') || clean.includes('us')) return 'en';
    if (clean.includes('fr') || clean.includes('fra')) return 'fr';
    if (clean.includes('sp') || clean.includes('es')) return 'es';
    if (clean.includes('de')) return 'de';
    if (clean.includes('cn') || clean.includes('zh')) return 'zh';
    if (clean.includes('ru') || clean.includes('rus')) return 'ru';

    return clean.substring(0, 2);
  }

  /**
   * Transcribes an in-memory audio buffer sent via Multer RAM storage.
   * @param {Buffer} audioBuffer - Audio file buffer in RAM
   * @param {Object} options - { filename, mimeType, language }
   * @returns {Promise<{ text: string, processTimeMs: number, audioSizeBytes: number }>}
   */
  static async transcribe(audioBuffer, options = {}) {
    const startTime = Date.now();

    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('Buffer audio vuoto o non valido.');
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('Chiave GROQ_API_KEY non configurata in process.env.GROQ_API_KEY.');
    }

    const groq = new Groq({ apiKey });
    const model = process.env.GROQ_STT_MODEL
    const filename = options.filename || 'recording.webm';
    const mimeType = options.mimeType || 'audio/webm';
    const language = this.normalizeLanguageCode(options.language);

    // Convert RAM buffer directly into a File object for groq-sdk (Zero disk I/O)
    const file = await toFile(audioBuffer, filename, { type: mimeType });

    const transcription = await groq.audio.transcriptions.create({
      file,
      model,
      language,
      temperature: 0.0, // Zero temperature to minimize language detection latency and maximize speed
      response_format: 'json'
    });

    const processTimeMs = Date.now() - startTime;

    return {
      text: transcription.text ? transcription.text.trim() : '',
      processTimeMs,
      audioSizeBytes: audioBuffer.length
    };
  }
}

module.exports = GroqSTTService;
