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
      if (art && art.museum) {
        museumId = art.museum.toString();
      }
    }

    if (isGroup && !isTeacher) {
      if (itemAction === 'NEXT_ITEM' || itemAction === 'PREVIOUS_ITEM') {
        return 'In questa visita di gruppo la navigazione tra le tappe è guidata dal docente. Puoi farmi domande sull\'opera corrente o chiedere informazioni sui servizi del museo.';
      }
    }

    switch (actionType) {
      case 'AUDIO_ACTION':
        return await this.audioActionHandler(audioFile, museumId, visitId, currentArtworkIndex, tone, length, language, isGroup, isTeacher, onTranscription, artworkId);
      case 'ITEM_ACTION':
        return await this.itemActionHandler(itemAction, visitId, currentArtworkIndex, tone, length, language, artworkId);
      case 'NON_ITEM_ACTION':
        return await this.nonItemActionHandler(targetPoiType, targetArtist, museumId, visitId, currentArtworkIndex, tone, length, language, artworkId);
      case 'MUSEUM_INFO':
        return await this.museumInfoHandler(userQuery, museumId, visitId, currentArtworkIndex, tone, length, language);
      case 'CULTURE_INFO':
        return await this.cultureInfoHandler(userQuery, museumId, visitId, currentArtworkIndex, tone, length, language, artworkId);
      case 'UNKNOWN_ACTION':
        return {
          text: this.getUnmappableActionMessage(language),
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

    if (!visitId && artworkId && (response.itemAction === 'NEXT_ITEM' || response.itemAction === 'PREVIOUS_ITEM')) {
      const singleMsg = language === 'en'
        ? "You are currently viewing this artwork individually outside a tour. You can ask for more details or information about the artist."
        : "Stai consultando questa singola opera al di fuori di un itinerario. Puoi chiedermi maggiori approfondimenti o dettagli sull'autore.";
      return {
        text: singleMsg,
        currentArtworkIndex: 0,
        itemAction: 'EXPLAIN_ITEM',
        tone,
        language,
        length
      };
    }

    if (isGroup && !isTeacher) {
      if (response.itemAction === 'NEXT_ITEM' || response.itemAction === 'PREVIOUS_ITEM') {
        return {
          text: 'In questa visita di gruppo la navigazione è guidata dal docente. Puoi chiedermi maggiori informazioni sull\'opera attuale o curiosità sul museo.',
          currentArtworkIndex: currentArtworkIndex,
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

    if (response.length) {
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

  static async itemActionHandler(itemAction, visitId, currentArtworkIndex, tone, length, language, artworkId = null) {
    if (!visitId && artworkId) {
      if (itemAction === 'NEXT_ITEM' || itemAction === 'PREVIOUS_ITEM') {
        const singleMsg = language === 'en'
          ? "You are currently viewing this artwork individually outside a tour. You can ask for more details or information about the artist."
          : "Stai consultando questa singola opera al di fuori di un itinerario. Puoi chiedermi maggiori approfondimenti o dettagli sull'autore.";
        return {
          text: singleMsg,
          currentArtworkIndex: 0,
          itemAction: 'EXPLAIN_ITEM',
          tone: tone,
          language: language,
          length: length
        };
      }
      const item = await this.getOrGenerateItemForArtwork(artworkId, tone, length, language, itemAction === 'TELL_ME_MORE');
      return {
        text: item.description ? item.description : '',
        currentArtworkIndex: 0,
        itemAction: itemAction,
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
          throw new Error('Sei già all\'ultima opera della visita.');
        }
        targetIndex = currentArtworkIndex + 1;
        break;

      case 'PREVIOUS_ITEM':
        if (currentArtworkIndex <= 0) {
          throw new Error('Sei già alla prima opera della visita.');
        }
        targetIndex = currentArtworkIndex - 1;
        break;

      case 'EXPLAIN_ITEM':
        targetIndex = currentArtworkIndex;
        break;

      default:
        throw new Error(`Azione item non riconosciuta: "${itemAction}".`);

      case 'TELL_ME_MORE':
        targetIndex = currentArtworkIndex;
        tellMeMore = true;
        break;
    }

    const item = await this.getOrGenerateItem(visitId, targetIndex, tone, length, language, tellMeMore);

    return {
      text: item.description ? item.description : '',
      currentArtworkIndex: targetIndex,
      itemAction: itemAction,
      tone: tone,
      language: language,
      length: length
    };
  }


  // TODO CHECK è possibile che ci sia bisogno di fixare gli item e come vengono presi
  static async getOrGenerateItem(visitId, targetIndex, tone, length, language, tellMeMore) {
    const steps = await this.getVisitSteps(visitId);

    if (targetIndex < 0 || targetIndex >= steps.length) {
      throw new Error(`Indice dell'opera ${targetIndex} fuori dai limiti per la visita "${visitId}". Fuori dai limiti: 0 - ${steps.length - 1}.`);
    }

    const step = steps[targetIndex];
    if (!step || !step.artwork) {
      throw new Error(`Nessun step valido trovato per l'indice ${targetIndex} nella visita "${visitId}".`);
    }
    console.log(`\n\x1b[34m🎨 [DEBUG SERVICE] Opera corrente: "${step}"\x1b[0m\n`);

    const artwork = await Artwork.findById(step.artwork).populate('defaultItems').exec();
    if (!artwork) {
      throw new Error(`Opera con ID "${step.artwork}" non trovata.`);
    }

    // TODO CHECK c'è anche da fare il tellMeMore che è un item a parte, se c'è si prende quello, altrimenti si genera con l'llm
    if (tellMeMore && step.tellMeMore) {
      const tellMeMoreItem = await Item.findById(step.tellMeMore).exec();
      if (tellMeMoreItem) {
        console.log(`\n\x1b[32m✅ [DEBUG SERVICE] Item "Tell Me More" trovato nel DB per opera "${step.artwork}" con tono "${tone}", lingua "${language}" e lunghezza "${length}".\x1b[0m\n`);
        return tellMeMoreItem;
      }
    } else {
      for (const stepItemId of step.items) {
        // controllo se c'è item giusto già ritoranto nella struttura
        const stepItem = await Item.findById(stepItemId).exec();
        console.log(`\n\x1b[34m🔍 [DEBUG SERVICE] Item trovato: ID: "${stepItemId}", Tono: "${stepItem?.tone}", Lingua: "${stepItem?.language}", Lunghezza: "${stepItem?.length}"\x1b[0m\n`);
        if (stepItem && stepItem.tone === tone && stepItem.language === language && stepItem.length === length) {
          console.log(`\n\x1b[32m✅ [DEBUG SERVICE] Item trovato nel DB per opera "${step.artwork}" con tono "${tone}", lingua "${language}" e lunghezza "${length}".\x1b[0m\n`);
          return stepItem;
        }
      }
      // controllo per item non messi da esterni nella visita
      const matchingItem = await this.getItem(artwork, tone, language, length);
      if (matchingItem) {
        console.log(`\n\x1b[32m✅ [DEBUG SERVICE] Item trovato nel DB per opera "${artwork.title}" con tono "${tone}", lingua "${language}" e lunghezza "${length}".\x1b[0m\n`);
        return matchingItem;
      }
    }

    // Se item non trovato ricicliamo il testo esistente di item sinonimi
    const rawExistingSimilarItem = this.getAvailableContentIfExists(artwork, tone, language, length);
    const existingSimilarItem = ItemMapper.toItemLLMRequestDTO(rawExistingSimilarItem);
    console.log(`\n\x1b[33m⚠️ [DEBUG SERVICE] Nessun item esatto trovato per opera "${artwork.title}" con tono "${tone}", lingua "${language}" e lunghezza "${length}".\x1b[0m\n`);

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

    if (!tellMeMore) {
      const matchingItem = await this.getItem(artwork, tone, language, length);
      if (matchingItem) {
        return matchingItem;
      }
    }

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
        throw new Error(`Punto di interesse di tipo "${targetPoiType}" non trovato nel museo "${museum.name}".`);
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
        resultText = `Non ci sono informazioni registrate sull'autore per l'opera "${artwork.title}".`;
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
    const lang = (language || 'it').toLowerCase();
    switch (lang) {
      case 'en':
        return "I cannot answer this request. I can guide you through the artworks, explain their history and artist, or provide information about the museum and its services.";
      case 'es':
        return "No puedo responder a esta solicitud. Puedo guiarte por las obras, explicar su historia y artista, o darte información sobre el museo y sus servicios.";
      case 'fr':
        return "Je ne peux pas répondre à cette demande. Je peux vous guider à travers les œuvres, vous expliquer leur histoire et leur artiste, ou vous renseigner sur le musée et ses services.";
      case 'de':
        return "Ich kann diese Anfrage leider nicht beantworten. Ich kann Sie durch die Kunstwerke führen, deren Geschichte und Künstler erklären oder Auskunft über das Museum und seine Dienste geben.";
      case 'it':
      default:
        return "Non posso rispondere a questa richiesta. Posso guidarti tra le opere, raccontarti la loro storia e l'artista, o darti informazioni sul museo e i suoi servizi.";
    }
  }
}

module.exports = NavigatorService;
