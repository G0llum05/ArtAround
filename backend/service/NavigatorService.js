const mongoose = require('mongoose');
const Item = require('../data/model/Item');
const Artwork = require('../data/model/Artwork');
const Visit = require('../data/model/Visit');
const Museum = require('../data/model/Museum');
const LLMService = require('./LLMService');
const NLParser = require('./NLParser');
const ItemMapper = require('../data/mapper/ItemMapper');
const ArtworkMapper = require('../data/mapper/ArtworkMapper');
const Sanitizer = require('../utils/Sanitizer');
const GroqSTTService = require('./GroqSTTService');
const NavigatorMessages = require('../utils/NavigatorMessages');


class NavigatorService {

  static async navigatorHandler(requestDTO) {
    let {
      language,
      length,
      tone,
      museumId,
      visitId,
      artworkId,
      currentArtworkIndex,
      actionType,
      audioFile,
      itemAction,
      targetStepIndex,
      stepOffset,
      targetPoiType,
      targetArtist,
      userQuery,
      isGroup,
      isTeacher,
      sessionCode,
      onTranscription
    } = requestDTO;

    if (!museumId && visitId) {
      const museum = await Museum.findOne({ visits: visitId }).lean();
      if (museum) {
        museumId = museum._id.toString();
      }
    }

    if (!museumId && artworkId) {
      let query = mongoose.Types.ObjectId.isValid(artworkId) ? { $or: [{ _id: artworkId }, { qrCode: artworkId }] } : { qrCode: artworkId };
      const art = await Artwork.findOne(query).lean();
      if (art) {
        if (art.museum) {
          museumId = art.museum.toString();
        } else {
          const mus = await Museum.findOne({ artworks: art._id }).lean();
          if (mus) {
            museumId = mus._id.toString();
          }
        }
      }
    }

    if (isGroup) {
      if (itemAction === 'JUMP_ITEM' || (!isTeacher && (itemAction === 'NEXT_ITEM' || itemAction === 'PREVIOUS_ITEM'))) {
        return {
          text: NavigatorMessages.getMessage('group_student_navigation_restricted', language),
          currentArtworkIndex: currentArtworkIndex || 0,
          itemAction: 'EXPLAIN_ITEM',
          tone,
          language,
          length
        };
      }
    }

    switch (actionType) {
      case 'AUDIO_ACTION':
        return await this.audioActionHandler(audioFile, museumId, visitId, currentArtworkIndex, tone, length, language, isGroup, isTeacher, onTranscription, artworkId);
      case 'ITEM_ACTION':
        return await this.itemActionHandler(itemAction, visitId, currentArtworkIndex, tone, length, language, artworkId, targetStepIndex, stepOffset, isGroup);
      case 'NON_ITEM_ACTION':
        return await this.nonItemActionHandler(targetPoiType, targetArtist, museumId, visitId, currentArtworkIndex, tone, length, language, artworkId);
      case 'MUSEUM_INFO':
        return await this.museumInfoHandler(userQuery, museumId, visitId, currentArtworkIndex, tone, length, language);
      case 'CULTURE_INFO':
        return await this.cultureInfoHandler(userQuery, museumId, visitId, currentArtworkIndex, tone, length, language, artworkId);
      case 'UNKNOWN_ACTION':
        return {
          text: NavigatorMessages.getMessage('unknown_action', language),
          currentArtworkIndex: currentArtworkIndex || 0,
          itemAction: null,
          tone,
          length,
          language
        };
      default:
        throw new Error(`Tipo di azione non valido: ${actionType}`);
    }
  }

  static async audioActionHandler(audioFile, museumId, visitId, currentArtworkIndex, tone, length, language, isGroup, isTeacher, onTranscription, artworkId = null) {
    if (!audioFile || !audioFile.buffer) {
      throw new Error('File audio mancante o non valido.');
    }

    const transcriptionResult = await GroqSTTService.transcribe(audioFile.buffer, {
      filename: audioFile.originalname,
      mimeType: audioFile.mimetype,
      language: language
    });

    const transcribedText = transcriptionResult.text;
    if (!transcribedText) {
      throw new Error('Trascrizione audio fallita o testo trascritto vuoto.');
    }

    if (typeof onTranscription === 'function') {
      await onTranscription(transcribedText);
    }

    const museum = museumId ? await Museum.findById(museumId).exec() : null;
    let artwork = null;
    if (visitId) {
      const artId = await this.getArtworkId(visitId, currentArtworkIndex);
      artwork = artId ? await Artwork.findById(artId).populate('artists').exec() : null;
    } else if (artworkId) {
      let query = mongoose.Types.ObjectId.isValid(artworkId) ? { $or: [{ _id: artworkId }, { qrCode: artworkId }] } : { qrCode: artworkId };
      artwork = await Artwork.findOne(query).populate('artists').populate('defaultItems').exec();
    }

    const response = await this.parseIntentHandler(transcribedText, museum, artwork, tone, length, language);
    if (!response || !response.actionType) {
      throw new Error('Parsing dell\'intento fallito o intento non riconosciuto.');
    }

    if (!visitId && artworkId && (response.itemAction === 'NEXT_ITEM' || response.itemAction === 'PREVIOUS_ITEM' || response.itemAction === 'JUMP_ITEM')) {
      return {
        text: NavigatorMessages.getMessage('single_artwork_no_tour', language),
        currentArtworkIndex: 0,
        itemAction: 'EXPLAIN_ITEM',
        tone,
        language,
        length
      };
    }

    if (isGroup) {
      if (response.itemAction === 'JUMP_ITEM' || (!isTeacher && (response.itemAction === 'NEXT_ITEM' || response.itemAction === 'PREVIOUS_ITEM'))) {
        return {
          text: NavigatorMessages.getMessage('group_student_navigation_restricted', language),
          currentArtworkIndex: currentArtworkIndex || 0,
          itemAction: 'EXPLAIN_ITEM',
          tone,
          language,
          length
        };
      }
    }

    if (response.language) {
      language = Sanitizer.sanitizeLanguage(response.language) || language;
    }

    if (response.itemAction === 'TELL_ME_LESS') {
      if (!response.length || response.length >= length) {
        length = length > 30 ? 30 : 15;
      } else {
        length = Sanitizer.sanitizeLength(response.length) || (length > 30 ? 30 : 15);
      }
    } else if (response.itemAction === 'TELL_ME_MORE') {
      if (!response.length || response.length <= length) {
        length = length < 30 ? 30 : 60;
      } else {
        length = Sanitizer.sanitizeLength(response.length) || (length < 30 ? 30 : 60);
      }
    } else if (response.length) {
      length = Sanitizer.sanitizeLength(response.length) || length;
    }

    if (response.tone) {
      tone = Sanitizer.sanitizeTone(response.tone) || tone;
    }

    const finalResult = await this.navigatorHandler({
      language,
      length,
      tone,
      museumId: museumId,
      visitId: visitId,
      artworkId: artworkId,
      currentArtworkIndex: currentArtworkIndex || 0,
      actionType: response.actionType,
      audioFile: null,
      itemAction: response.itemAction || null,
      targetStepIndex: response.targetStepIndex !== undefined ? response.targetStepIndex : null,
      stepOffset: response.stepOffset !== undefined ? response.stepOffset : null,
      targetPoiType: response.targetPoiType || null,
      targetArtist: response.targetArtist || null,
      userQuery: response.userQuery || transcribedText,
      isGroup,
      isTeacher
    });

    return finalResult;
  }

  static async parseIntentHandler(transcribedText, museum, artwork, tone, length, language) {
    try {
      const llmResult = await LLMService.parseIntentLLM(transcribedText, museum, artwork, tone, length, language);
      if (llmResult) {
        return llmResult;
      }
      throw new Error('Intent non riconosciuto dall\'LLM.');
    } catch (error) {
      console.error('Errore durante il parsing dell\'intento:', error);
      throw new Error('Errore durante il parsing dell\'intento.');
    }
  }

  static async itemActionHandler(itemAction, visitId, currentArtworkIndex, tone, length, language, artworkId = null, targetStepIndex = null, stepOffset = null, isGroup = false) {
    let effectiveLength = Sanitizer.sanitizeLength(length) || 30;
    length = effectiveLength;

    if (itemAction === 'TELL_ME_LESS') {
      length = length > 30 ? 30 : 15;
    } else if (itemAction === 'TELL_ME_MORE') {
      length = length < 30 ? 30 : 60;
    }

    if (!visitId && artworkId) {
      if (itemAction === 'NEXT_ITEM' || itemAction === 'PREVIOUS_ITEM' || itemAction === 'JUMP_ITEM') {
        return {
          text: NavigatorMessages.getMessage('single_artwork_no_tour', language),
          currentArtworkIndex: 0,
          itemAction: 'EXPLAIN_ITEM',
          tone: tone,
          language: language,
          length: length
        };
      }
      const item = await this.getOrGenerateItemForArtwork(artworkId, tone, length, language, itemAction === 'TELL_ME_MORE');
      let query = mongoose.Types.ObjectId.isValid(artworkId) ? { $or: [{ _id: artworkId }, { qrCode: artworkId }] } : { qrCode: artworkId };
      const artworkDoc = await Artwork.findOne(query).populate('artists').populate('defaultItems').lean();
      let artworkData = null;
      if (artworkDoc) {
        if (!artworkDoc.museum) {
          const museum = await Museum.findOne({ artworks: artworkDoc._id }).lean();
          if (museum) artworkDoc.museum = museum._id.toString();
        }
        artworkData = ArtworkMapper.toArtworkResponseDTO(artworkDoc);
      }
      return {
        text: item.description ? item.description : '',
        currentArtworkIndex: 0,
        itemAction: itemAction,
        tone: tone,
        language: language,
        length: length,
        targetArtwork: artworkId,
        artwork: artworkData,
        imageUrl: artworkData?.assets?.images?.[0]?.url || null
      };
    }

    if (isGroup && itemAction === 'JUMP_ITEM') {
      return {
        text: NavigatorMessages.getMessage('group_student_navigation_restricted', language),
        currentArtworkIndex: currentArtworkIndex || 0,
        itemAction: 'EXPLAIN_ITEM',
        tone: tone,
        language: language,
        length: length
      };
    }

    let targetIndex = currentArtworkIndex;
    let tellMeMore = false;
    const steps = await this.getVisitSteps(visitId);

    switch (itemAction) {
      case 'NEXT_ITEM':
        if (currentArtworkIndex >= steps.length - 1) {
          return {
            text: NavigatorMessages.getMessage('tour_already_at_last', language),
            currentArtworkIndex,
            itemAction: 'EXPLAIN_ITEM',
            tone,
            language,
            length
          };
        }
        targetIndex = currentArtworkIndex + 1;
        break;

      case 'PREVIOUS_ITEM':
        if (currentArtworkIndex <= 0) {
          return {
            text: NavigatorMessages.getMessage('tour_already_at_first', language),
            currentArtworkIndex,
            itemAction: 'EXPLAIN_ITEM',
            tone,
            language,
            length
          };
        }
        targetIndex = currentArtworkIndex - 1;
        break;

      case 'JUMP_ITEM':
        if (targetStepIndex !== null && targetStepIndex !== undefined) {
          if (typeof targetStepIndex === 'string') {
            const normalized = targetStepIndex.toUpperCase().trim();
            if (normalized === 'LAST') {
              targetIndex = steps.length - 1;
            } else if (normalized === 'FIRST') {
              targetIndex = 0;
            } else if (normalized === 'PENULTIMATE') {
              targetIndex = Math.max(0, steps.length - 2);
            } else {
              const parsed = parseInt(targetStepIndex, 10);
              if (!isNaN(parsed)) {
                targetIndex = parsed;
              }
            }
          } else if (typeof targetStepIndex === 'number' && !isNaN(targetStepIndex)) {
            targetIndex = targetStepIndex;
          }
        } else if (stepOffset !== null && stepOffset !== undefined) {
          const parsedOffset = parseInt(stepOffset, 10);
          if (!isNaN(parsedOffset)) {
            targetIndex = currentArtworkIndex + parsedOffset;
          }
        }
        targetIndex = Math.max(0, Math.min(steps.length - 1, targetIndex));
        break;

      case 'EXPLAIN_ITEM':
        targetIndex = currentArtworkIndex;
        break;

      case 'TELL_ME_MORE':
        targetIndex = currentArtworkIndex;
        tellMeMore = true;
        break;

      case 'TELL_ME_LESS':
        targetIndex = currentArtworkIndex;
        break;

      default:
        throw new Error(`Azione item non riconosciuta: "${itemAction}".`);
    }

    const item = await this.getOrGenerateItem(visitId, targetIndex, tone, length, language, tellMeMore);
    let stepArtworkData = null;
    const currentStepArtId = steps[targetIndex]?.artwork;
    if (currentStepArtId) {
      const stepArtDoc = await Artwork.findById(currentStepArtId).populate('artists').lean();
      if (stepArtDoc) {
        stepArtworkData = ArtworkMapper.toArtworkResponseDTO(stepArtDoc);
      }
    }

    return {
      text: item.description ? item.description : '',
      currentArtworkIndex: targetIndex,
      itemAction: itemAction,
      tone: tone,
      language: language,
      length: length,
      targetArtwork: currentStepArtId ? currentStepArtId.toString() : null,
      artwork: stepArtworkData,
      imageUrl: stepArtworkData?.assets?.images?.[0]?.url || null
    };
  }


  static async getOrGenerateItem(visitId, targetIndex, tone, length, language, tellMeMore) {
    const steps = await this.getVisitSteps(visitId);

    if (targetIndex < 0 || targetIndex >= steps.length) {
      throw new Error(`Indice dell'opera ${targetIndex} fuori dai limiti per la visita "${visitId}". Fuori dai limiti: 0 - ${steps.length - 1}.`);
    }

    const step = steps[targetIndex];
    if (!step || !step.artwork) {
      throw new Error(`Nessun step valido trovato per l'indice ${targetIndex} nella visita "${visitId}".`);
    }

    const artwork = await Artwork.findById(step.artwork).populate('defaultItems').exec();
    if (!artwork) {
      throw new Error(`Opera con ID "${step.artwork}" non trovata.`);
    }

    if (tellMeMore && step.tellMeMore) {
      const tellMeMoreItem = await Item.findById(step.tellMeMore).exec();
      if (tellMeMoreItem) {
        return tellMeMoreItem;
      }
    }

    // Se non è tellMeMore, cerchiamo un item già pronto con tono, lingua e lunghezza corrispondenti
    if (!tellMeMore) {
      for (const stepItemId of step.items) {
        // controllo se c'è item giusto già ritornato nella struttura
        const stepItem = await Item.findById(stepItemId).exec();
        if (stepItem && stepItem.tone === tone && stepItem.language === language && stepItem.length === length) {
          return stepItem;
        }
      }
      // controllo per item non messi da esterni nella visita
      const matchingItem = await this.getItem(artwork, tone, language, length);
      if (matchingItem) {
        return matchingItem;
      }
    }

    // Se tellMeMore (e non c'era step.tellMeMore) oppure nessun item trovato,
    // esegue SEMPRE la richiesta all'LLM per generare la spiegazione approfondita con durata aumentata
    const rawExistingSimilarItem = this.getAvailableContentIfExists(artwork, tone, language, length);
    const existingSimilarItem = ItemMapper.toItemLLMRequestDTO(rawExistingSimilarItem);

    const artworkContext = ArtworkMapper.toArtworkLLMRequestDTO(artwork);

    const generatedText = await LLMService.generateItem(tone, length, language, existingSimilarItem, artworkContext, tellMeMore);

    const newItem = new Item({
      description: generatedText,
      tone: tone,
      length: length,
      language: language,
      isAIGenerated: true,
      authorName: 'AI Engine',
      artwork: artwork._id
    });
    const savedItem = await newItem.save();
    step.items.push(savedItem._id);
    await Visit.findByIdAndUpdate(visitId, { $set: { [`steps.${targetIndex}`]: step } }).exec();

    return savedItem;
  }

  static async getOrGenerateItemForArtwork(artworkId, tone, length, language, tellMeMore) {
    let query = mongoose.Types.ObjectId.isValid(artworkId) ? { $or: [{ _id: artworkId }, { qrCode: artworkId }] } : { qrCode: artworkId };
    const artwork = await Artwork.findOne(query).populate('artists').populate('defaultItems').exec();
    if (!artwork) {
      throw new Error(`Opera con ID "${artworkId}" non trovata.`);
    }

    // Se non è tellMeMore, cerca un item compatibile già esistente
    if (!tellMeMore) {
      const matchingItem = await this.getItem(artwork, tone, language, length);
      if (matchingItem) {
        return matchingItem;
      }
    }

    // Se tellMeMore (richiesta approfondimento) o nessun item esistente, chiama per forza l'LLM
    const rawExistingSimilarItem = this.getAvailableContentIfExists(artwork, tone, language, length);
    const existingSimilarItem = ItemMapper.toItemLLMRequestDTO(rawExistingSimilarItem);
    const artworkContext = ArtworkMapper.toArtworkLLMRequestDTO(artwork);

    const generatedText = await LLMService.generateItem(tone, length, language, existingSimilarItem, artworkContext, tellMeMore);

    const newItem = new Item({
      description: generatedText,
      tone: tone,
      length: length,
      language: language,
      isAIGenerated: true,
      authorName: 'AI Engine',
      artwork: artwork._id
    });
    const savedItem = await newItem.save();
    await Artwork.findByIdAndUpdate(artwork._id, { $addToSet: { defaultItems: savedItem._id } }).exec();

    return savedItem;
  }

  static async nonItemActionHandler(targetPoiType, targetArtist, museumId, visitId, currentArtworkIndex, tone, length, language, artworkId = null) {
    let resultText = '';
    if (targetPoiType) {
      const museum = await Museum.findById(museumId).populate('pointsOfInterest').exec();
      if (!museum) {
        throw new Error(`Museo con ID "${museumId}" non trovato.`);
      }

      const POI = museum.pointsOfInterest.find(p => p.type === targetPoiType);

      if (!POI) {
        return {
          text: NavigatorMessages.getMessage('poi_not_found', language, { poi: targetPoiType, museum: museum.name }),
          currentArtworkIndex: currentArtworkIndex || 0,
          itemAction: null,
          targetArtist: null,
          targetPoiType: targetPoiType,
          tone,
          language,
          length
        };
      }

      resultText = await LLMService.nonItemPOI(museum.name, POI, language, tone);

    } else if (targetArtist) {
      let artwork = null;
      if (visitId) {
        const currentArtworkId = await this.getArtworkId(visitId, currentArtworkIndex);
        artwork = currentArtworkId ? await Artwork.findById(currentArtworkId).populate('defaultItems').populate('artists').exec() : null;
      } else if (artworkId) {
        let query = mongoose.Types.ObjectId.isValid(artworkId) ? { $or: [{ _id: artworkId }, { qrCode: artworkId }] } : { qrCode: artworkId };
        artwork = await Artwork.findOne(query).populate('defaultItems').populate('artists').exec();
      }

      if (!artwork) {
        throw new Error('Opera non trovata.');
      }

      let artist = null;
      if (artwork.artists && artwork.artists.length > 0) {
        if (typeof targetArtist === 'string' && targetArtist !== 'CURRENT_AUTHOR' && targetArtist.toLowerCase() !== 'autore' && targetArtist.toLowerCase() !== "l'autore") {
          artist = artwork.artists.find(a => {
            const fullName = `${a.name || ''} ${a.surname || ''}`.toLowerCase().trim();
            const target = targetArtist.toLowerCase().trim();
            return fullName.includes(target) || target.includes((a.name || '').toLowerCase()) || (a.surname && target.includes(a.surname.toLowerCase()));
          });
        }
        if (!artist) {
          artist = artwork.artists[0];
        }
      }

      if (!artist) {
        resultText = NavigatorMessages.getMessage('no_artist_info', language, { title: artwork.title || '' });
      } else {
        resultText = await LLMService.nonItemArtistInfo(artist, artwork, tone, length, language);
      }
    } else {
      throw new Error('Nessuna azione non-item valida fornita.');
    }

    return {
      text: resultText,
      currentArtworkIndex: currentArtworkIndex || 0,
      itemAction: null,
      targetArtist: targetArtist || null,
      targetPoiType: targetPoiType || null,
      tone,
      language,
      length
    };
  }

  static async getVisitSteps(visitId) {
    if (!visitId || !mongoose.Types.ObjectId.isValid(visitId)) {
      throw new Error(`ID visita non valido: "${visitId}". Dev'essere un ObjectId MongoDB di 24 caratteri.`);
    }
    const steps = await Visit.findById(visitId).populate('steps').exec();
    if (!steps) {
      throw new Error(`Visita con ID "${visitId}" non trovata.`);
    }
    return steps.steps || [];
  }

  static async getArtworkAndItemsByIndex(visitId, currentArtworkIndex) {
    const steps = await this.getVisitSteps(visitId);
    if (currentArtworkIndex < 0 || currentArtworkIndex >= steps.length) {
      throw new Error(`Indice dell'opera "${currentArtworkIndex}" fuori dai limiti per la visita "${visitId}".`);
    }

    // se non ci sono items nella visita associati all'artwork si usano i defaultItems dell'opera, altrimenti si usano questi

  }

  static async getArtworkId(visitId, currentArtworkIndex) {
    if (!visitId || !mongoose.Types.ObjectId.isValid(visitId)) {
      throw new Error(`ID visita non valido: "${visitId}". Dev'essere un ObjectId MongoDB di 24 caratteri.`);
    }
    const steps = await Visit.findById(visitId).populate('steps').exec();
    if (!steps) {
      throw new Error(`Visita con ID "${visitId}" non trovata.`);
    }
    return steps.steps[currentArtworkIndex]?.artwork || null;
  }


  static async getItem(artwork, tone, language, length) {

    const items = artwork.defaultItems || [];
    const targetLanguage = (language || 'it').toLowerCase();
    const targetLength = parseInt(length, 10);

    return items.find(item =>
      item.tone === tone && item.language === targetLanguage && item.length === targetLength
    );
  }

  // TODO CHECK
  // !!! PRESTARE ATTENZIONE !!! La scelta dei valori è ben precisa, 13, 10, 5, 1. Se tot - 10 c'è lunghezza. Se tot (o rimanente) - 5 c'è tono. Se tot (o rimanente) - 3 c'è lunghezza giusta. Se tot (o rimanente) - 1 c'è lingua giusta. In questo modo si può dire nel prompt che cosa è stato trovato e cosa no e allo stesso tempo lunghezza maggiore + lingua vince su lunghezza giusta (e anche + lingua giusta)
  static getAvailableContentIfExists(artwork, tone, language, length) {
    const items = artwork?.defaultItems || [];
    if (items.length === 0) return null;

    const targetLanguage = (language || 'it').toLowerCase();
    const targetLength = parseInt(length, 10) || 30;
    const targetTone = tone || 'medium';

    // Riciclo contenuto basato su punteggio di priorità Lunghezza > Tono > Lingua
    const scoredItems = items.map(item => {
      let score = 0;

      // lunghezza
      const itemLen = parseInt(item.length, 10) || 30;
      if (itemLen === targetLength) {
        score += 13; // Stessa lunghezza
      } else if (itemLen > targetLength) {
        score += 10; // Più lunga del richiesto
      }

      // tono
      if (item.tone === targetTone) {
        score += 5;
      }

      // lingua
      const itemLang = (item.language || 'it').toLowerCase();
      if (itemLang === targetLanguage) {
        score += 1;
      }

      return { item, score };
    });

    // Ordine decrescente di punteggio
    scoredItems.sort((a, b) => b.score - a.score);

    return scoredItems[0]?.item || null;
  }

  static async museumInfoHandler(userQuery, museumId, visitId, currentArtworkIndex, tone, length, language) {
    const museum = museumId ? await Museum.findById(museumId).exec() : null;
    const visit = visitId ? await Visit.findById(visitId).exec() : null;

    const museumContext = museum ? {
      name: museum.name,
      description: museum.description,
      address: museum.address,
      contact: museum.contact,
      ticketInfo: museum.ticketInfo,
      openingHours: museum.openingHours,
      services: museum.services,
      accessibility: museum.accessibility,
      transportInfo: museum.transportInfo,
      eventsAndExhibitions: museum.eventsAndExhibitions,
      requirements: museum.requirements
    } : {};

    const visitContext = visit ? {
      title: visit.title,
      description: visit.description,
      price: visit.price,
      minDuration: visit.minDuration,
      maxDuration: visit.maxDuration,
      weeklySchedule: visit.weeklySchedule,
      requirements: visit.requirements,
      categories: visit.categories
    } : {};

    const resultText = await LLMService.museumInfo(userQuery, museumContext, visitContext, tone, length, language);

    return {
      text: resultText,
      currentArtworkIndex,
      itemAction: null,
      tone,
      language,
      length
    };
  }

  static async cultureInfoHandler(userQuery, museumId, visitId, currentArtworkIndex, tone, length, language, artworkId = null) {
    let artwork = null;
    if (visitId) {
      const currentArtworkId = await this.getArtworkId(visitId, currentArtworkIndex);
      artwork = currentArtworkId ? await Artwork.findById(currentArtworkId).populate('artists').exec() : null;
    } else if (artworkId) {
      let query = mongoose.Types.ObjectId.isValid(artworkId) ? { $or: [{ _id: artworkId }, { qrCode: artworkId }] } : { qrCode: artworkId };
      artwork = await Artwork.findOne(query).populate('artists').exec();
    }
    const museum = museumId ? await Museum.findById(museumId).exec() : null;

    const artworkContext = artwork ? ArtworkMapper.toArtworkLLMRequestDTO(artwork) : { title: 'Opere del museo', museum: museum?.name || 'Museo' };

    const resultText = await LLMService.cultureInfo(userQuery, artworkContext, museum?.name, tone, length, language);

    return {
      text: resultText,
      currentArtworkIndex: currentArtworkIndex || 0,
      itemAction: null,
      tone,
      language,
      length
    };
  }

  static getUnmappableActionMessage(language = 'it') {
    return NavigatorMessages.getMessage('unknown_action', language);
  }
}

module.exports = NavigatorService;
