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

    this.artworkId = body.artworkId && typeof body.artworkId === 'string' ? body.artworkId.trim() : null;
    this.visitId = body.visitId && typeof body.visitId === 'string' ? body.visitId.trim() : null;
    if (this.visitId && !mongoose.Types.ObjectId.isValid(this.visitId)) {
      throw new Error(`Parametro 'visitId' non valido: "${body.visitId}". Deve essere un ObjectId MongoDB di 24 caratteri.`);
    }
    if (!this.visitId && !this.artworkId) {
      throw new Error(`È necessario specificare 'visitId' oppure 'artworkId'.`);
    }

    const trimmedMuseumId = body.museumId && typeof body.museumId === 'string' ? body.museumId.trim() : null;
    this.museumId = trimmedMuseumId && mongoose.Types.ObjectId.isValid(trimmedMuseumId) ? trimmedMuseumId : null;

    const parsedIdx = parseInt(body.currentArtworkIndex, 10);
    this.currentArtworkIndex = !isNaN(parsedIdx) && parsedIdx >= 0 ? parsedIdx : (this.artworkId ? 0 : null);
    if (this.currentArtworkIndex === null) {
      throw new Error(`Parametro 'currentArtworkIndex' mancante o non valido: ${body.currentArtworkIndex}`);
    }

    this.actionType = this._determineActionType(body, file);
    if (this.actionType === 'ERROR') {
      throw new Error(`Nessuna azione valida trovata nella richiesta. Controlla i parametri inviati.`);
    }

    this.audioFile = file ? {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    } : null;

    this.itemAction = body.itemAction || (body.targetStepIndex !== undefined || body.stepOffset !== undefined ? 'JUMP_ITEM' : (this.artworkId && !body.userQuery && !body.targetPoiType && !body.targetArtist ? 'EXPLAIN_ITEM' : (body.actionType === 'ITEM_ACTION' ? 'EXPLAIN_ITEM' : null)));

    this.targetStepIndex = body.targetStepIndex !== undefined ? body.targetStepIndex : null;
    this.stepOffset = body.stepOffset !== undefined ? body.stepOffset : null;

    this.targetPoiType = body.targetPoiType || null;
    this.targetArtist = body.targetArtist || null;

    this.userQuery = body.userQuery || body.query || body.question || null;

    this.isGroup = body.isGroup === true || body.isGroup === 'true';
    this.isTeacher = body.isTeacher === true || body.isTeacher === 'true';
    this.sessionCode = body.sessionCode ? body.sessionCode.toUpperCase().trim() : null;
  }

  _determineActionType(body, file) {
    if (file) return 'AUDIO_ACTION';
    if (body.actionType) return body.actionType;
    if (body.itemAction || body.targetStepIndex !== undefined || body.stepOffset !== undefined || (body.artworkId && !body.targetPoiType && !body.targetArtist && !body.userQuery && !body.query && !body.question)) return 'ITEM_ACTION';
    if (body.targetPoiType || body.targetArtist) return 'NON_ITEM_ACTION';
    if (body.userQuery || body.query || body.question) return 'CULTURE_INFO';
    return 'ERROR';
  }
}

class NavigatorResponseDTO {
  constructor(result = '', audio = null, error = null) {
    if (typeof result === 'string') {
      this.text = result;
      this.currentArtworkIndex = null;
      this.itemAction = null;
      this.targetStepIndex = null;
      this.stepOffset = null;
      this.targetArtist = null;
      this.targetArtwork = null;
      this.artwork = null;
      this.imageUrl = null;
      this.tone = null;
      this.language = null;
      this.length = null;
    } else {
      this.text = result?.text || result?.description || '';
      this.currentArtworkIndex = result?.currentArtworkIndex !== undefined ? result.currentArtworkIndex : null;
      this.itemAction = result?.itemAction || null;
      this.targetStepIndex = result?.targetStepIndex !== undefined ? result.targetStepIndex : null;
      this.stepOffset = result?.stepOffset !== undefined ? result.stepOffset : null;
      this.targetArtist = result?.targetArtist || null;
      this.targetArtwork = result?.targetArtwork || null;
      this.artwork = result?.artwork || null;
      this.imageUrl = result?.imageUrl || result?.artwork?.assets?.images?.[0]?.url || null;
      this.tone = result?.tone || null;
      this.language = result?.language || null;
      this.length = result?.length !== undefined ? result.length : null;
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
