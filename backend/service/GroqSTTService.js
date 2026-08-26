const { Groq, toFile } = require('groq-sdk');
const Sanitizer = require("../utils/Sanitizer")

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
   * Transcribes an in-memory audio buffer sent via Multer RAM storage.
   * @param {Buffer} audioBuffer - Audio file buffer in RAM
   * @param {Object} options - { filename, mimeType, language }
   * @returns {Promise<{ text: string, audioSizeBytes: number }>}
   */
  static async transcribe(audioBuffer, options = {}) {

    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('Buffer audio vuoto o non valido.');
    }

    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_STT_MODEL
    if (!apiKey || !model) {
      throw new Error('GROQ_API_KEY o GROQ_STT_MODEL non configurati. Controlla le variabili d\'ambiente.');
    }

    const groq = new Groq({ apiKey });
    const filename = options.filename || 'recording.webm';
    const mimeType = options.mimeType || 'audio/webm';
    const language = Sanitizer.sanitizeLanguage(options.language);
    if (!language) {
      throw new Error(`Parametro 'language' mancante o non valido: ${options.language}`);
    }

    // Convert RAM buffer directly into a File object for groq-sdk (Zero disk I/O)
    const file = await toFile(audioBuffer, filename, { type: mimeType });

    const reqParams = {
      file,
      model,
      language,
      temperature: 0.0, // Zero temperature to minimize language detection latency and maximize speed
      response_format: 'json'
    }

    const transcription = await groq.audio.transcriptions.create(reqParams);

    return {
      text: transcription.text.trim(),
      audioSizeBytes: audioBuffer.length
    };
  }
}

module.exports = GroqSTTService;
