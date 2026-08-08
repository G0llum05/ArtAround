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

    // visita e opera
    this.visitId = body.visitId && typeof body.visitId === 'string' ? body.visitId.trim() : null;
    if (!this.visitId) {
      throw new Error(`Parametro 'visitId' mancante o non valido: ${body.visitId}`);
    }

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
  }

  _determineActionType(body, file) {
    if (file) return 'AUDIO_ACTION';
    if (body.itemAction) return 'ITEM_ACTION';
    if (body.targetPoiType || body.targetArtist) return 'NON_ITEM_ACTION';
    return 'ERROR';
  }
}

class NavigatorResponseDTO {
  constructor(description = '', error = null) {
    this.text = description;
    if (error) {
      this.error = error;
    }
  }
}

module.exports = {
  NavigatorRequestDTO,
  NavigatorResponseDTO
};
