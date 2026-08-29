const mongoose = require('mongoose');
const Sanitizer = require('../../../utils/Sanitizer');

class NavigatorRequestDTO {
  constructor(body = {}, file = null) {
    // attributi base
    this.language = Sanitizer.sanitizeLanguage(body.language);
    this.length = Sanitizer.sanitizeLength(body.length);
    this.tone = Sanitizer.sanitizeTone(body.tone);

    if (!this.language) {
      throw new Error(`Parametro 'language' mancante o non valido: ${body.language}`);
    }
    if (!this.length) {
      throw new Error(`Parametro 'length' mancante o non valido: ${body.length}`);
    }
    if (!this.tone) {
      throw new Error(`Parametro 'tone' mancante o non valido: ${body.tone}`);
    }

    // museo, visita e opera
    this.visitId = body.visitId && typeof body.visitId === 'string' ? body.visitId.trim() : null;
    if (!this.visitId || !mongoose.Types.ObjectId.isValid(this.visitId)) {
      throw new Error(`Parametro 'visitId' non valido: "${body.visitId}". Deve essere un ObjectId MongoDB di 24 caratteri.`);
    }

    const trimmedMuseumId = body.museumId && typeof body.museumId === 'string' ? body.museumId.trim() : null;
    this.museumId = trimmedMuseumId && mongoose.Types.ObjectId.isValid(trimmedMuseumId) ? trimmedMuseumId : null;

    const parsedIdx = parseInt(body.currentArtworkIndex, 10);
    this.currentArtworkIndex = !isNaN(parsedIdx) && parsedIdx >= 0 ? parsedIdx : null;
    if (this.currentArtworkIndex === null) {
      throw new Error(`Parametro 'currentArtworkIndex' mancante o non valido: ${body.currentArtworkIndex}`);
    }

    // Azioni

    // 'AUDIO_ACTION' | 'ITEM_ACTION' | 'NON_ITEM_ACTION' | 'ERROR'
    this.actionType = this._determineActionType(body, file);
    if (this.actionType === 'ERROR') {
      throw new Error(`Nessuna azione valida trovata nella richiesta. Controlla i parametri inviati.`);
    }

    // Audio (Audio Action)
    this.audioFile = file ? {
      // TODO CHECK audio file properties
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    } : null;

    // Item Action
    this.itemAction = body.itemAction || null;

    // Non Item Action
    this.targetPoiType = body.targetPoiType || null;
    this.targetArtist = body.targetArtist || null;

    // Modalità Visita di Gruppo
    this.isGroup = body.isGroup === true || body.isGroup === 'true';
    this.isTeacher = body.isTeacher === true || body.isTeacher === 'true';
    this.sessionCode = body.sessionCode ? body.sessionCode.toUpperCase().trim() : null;
  }

  _determineActionType(body, file) {
    if (file) return 'AUDIO_ACTION';
    if (body.itemAction) return 'ITEM_ACTION';
    if (body.targetPoiType || body.targetArtist) return 'NON_ITEM_ACTION';
    return 'ERROR';
  }
}

class NavigatorResponseDTO {
  constructor(description = '', audio = null, error = null) {
    this.text = typeof description === 'string' ? description : (description?.description || description?.text || '');
    if (description && typeof description === 'object' && Number.isInteger(description.currentArtworkIndex)) {
      this.currentArtworkIndex = description.currentArtworkIndex;
    }
    this.audio = audio;
    if (error) {
      this.error = error;
    }
  }
}

module.exports = {
  NavigatorRequestDTO,
  NavigatorResponseDTO
};
