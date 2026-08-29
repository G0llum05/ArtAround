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
      currentArtworkIndex,
      actionType,
      audioFile,
      itemAction,
      targetPoiType,
      targetArtist,
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

    // Se l'utente è uno studente in una visita di gruppo, blocca richieste di cambio opera
    if (isGroup && !isTeacher) {
      if (itemAction === 'NEXT_ITEM' || itemAction === 'PREVIOUS_ITEM') {
        return 'In questa visita di gruppo la navigazione tra le tappe è guidata dal docente. Puoi farmi domande sull\'opera corrente o chiedere informazioni sui servizi del museo.';
      }
    }

    switch (actionType) {
      case 'AUDIO_ACTION':
        return await this.audioActionHandler(audioFile, museumId, visitId, currentArtworkIndex, tone, length, language, isGroup, isTeacher, onTranscription);
      case 'ITEM_ACTION':
        return await this.itemActionHandler(itemAction, visitId, currentArtworkIndex, tone, length, language);
      case 'NON_ITEM_ACTION':
        return await this.nonItemActionHandler(targetPoiType, targetArtist, museumId, visitId, currentArtworkIndex, tone, length, language);
      default:
        throw new Error(`Tipo di azione non valido: ${actionType}`);
    }
  }

  static async audioActionHandler(audioFile, museumId, visitId, currentArtworkIndex, tone, length, language, isGroup, isTeacher, onTranscription) {
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

    console.log(`\n\x1b[35m🎤 [DEBUG SERVICE] Testo trascritto dall'audio:\x1b[0m "${transcribedText}"\n`);

    // Quando ha trascritto il testo lo inviamo nello streaming aperto al front
    if (typeof onTranscription === 'function') {
      // onTranscription è una funzione che invia il testo trascritto al frontend in tempo reale
      await onTranscription(transcribedText);
    }

    // Se lo studente in visita di gruppo chiede a voce di cambiare opera, intercettiamo e blocchiamo
    if (isGroup && !isTeacher) {
      const museum = await Museum.findById(museumId).exec();
      if (!museum) {
        throw new Error(`Museo con ID "${museumId}" non trovato.`);
      }
      const artwork = await Artwork.findById(await this.getArtworkId(visitId, currentArtworkIndex)).exec();
      const response = await this.parseIntentHandler(transcribedText, museum, artwork, tone, length, language);

      if (response?.itemAction === 'NEXT_ITEM' || response?.itemAction === 'PREVIOUS_ITEM') {
        return 'In questa visita di gruppo la navigazione è guidata dal docente. Puoi chiedermi maggiori informazioni sull\'opera attuale o curiosità sul museo.';
      }
    }

    // e continua l'elaborazione standard
    const museum = await Museum.findById(museumId).exec();
    if (!museum) {
      throw new Error(`Museo con ID "${museumId}" non trovato.`);
    }
    const artwork = await Artwork.findById(await this.getArtworkId(visitId, currentArtworkIndex)).exec();

    // prima parser scritto a mano, se non riesce chiamate all'LLM. L'obiettivo di entrambi è capire l'intento, poi si passa agli handler item o non-item
    const response = await this.parseIntentHandler(transcribedText, museum, artwork, tone, length, language);
    if (!response || !response.actionType) {
      throw new Error('Parsing dell\'intento fallito o intento non riconosciuto.');
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
      currentArtworkIndex: currentArtworkIndex,
      actionType: response.actionType,
      audioFile: null, // rimosso l'audio
      itemAction: response.itemAction || null,
      targetPoiType: response.targetPoiType || null,
      targetArtist: response.targetArtist || null,
      isGroup,
      isTeacher
    });

    return finalResult;
  }


  /**
  * @returns {Promise<{ actionType: string, itemAction?: string, targetPoiType?: string, targetArtist?: string }>}
  */
  static async parseIntentHandler(transcribedText, language) {
    try {
      // const nlpResult = await NLParser.parseIntentNL(transcribedText, language);
      // if (nlpResult) {
      //   return nlpResult;
      // }
      const llmResult = await LLMService.parseIntentLLM(transcribedText, language);
      if (llmResult) {
        return llmResult;
      }
      throw new Error('Intent non riconosciuto né dal parser né dall\'LLM.');
    } catch (error) {
      console.error('Errore durante il parsing dell\'intento:', error);
      throw new Error('Errore durante il parsing dell\'intento.');
    }
  }

  /**
   * retituisce item con scelte cache-first:
   * - Cerca prima nel DB se esiste già l'item giusto
   * - Se non esiste cerca item simili e genera un nuovo item con dati esistenti
   * - Se non esiste proprio niente non da linee guida all'llm e lo genera con conoscenze generali
   */
  // TODO CHECK aggiungere il tellMeMore perchè ora c'è un item tell me more che prima non c'era
  static async itemActionHandler(itemAction, visitId, currentArtworkIndex, tone, length, language) {
    let targetIndex = currentArtworkIndex;

    let tellMeMore = false;

    switch (itemAction) {
      case 'NEXT_ITEM':
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

    console.log('\n\x1b[36m🔍 [DEBUG SERVICE] Contenuto della descrizione:\x1b[0m');
    console.log(`   • Tipo dato: ${typeof item}`);
    console.log(`   • Descrizione: "${item.description}"\n`);

    return item.description
      ? {
          text: item.description,
          currentArtworkIndex: targetIndex
        }
      : null;
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
    // salva l'item nella visita allo step corrente
    step.items.push(savedItem._id);
    await Visit.findByIdAndUpdate(visitId, { $set: { [`steps.${targetIndex}`]: step } }).exec();

    return savedItem;
  }

  static async nonItemActionHandler(targetPoiType, targetArtist, museumId, visitId, currentArtworkIndex, tone, length, language) {
    // POI
    if (targetPoiType) {
      const museum = await Museum.findById(museumId).populate('pointsOfInterest').exec();
      if (!museum) {
        throw new Error(`Museo con ID "${museumId}" non trovato.`);
      }

      const POI = museum.pointsOfInterest.find(p => p.type === targetPoiType);

      if (!POI) {
        throw new Error(`Punto di interesse di tipo "${targetPoiType}" non trovato nel museo "${museum.name}".`);
      }

      return LLMService.nonItemPOI(museum.name, POI, language, tone);

    } else if (targetArtist) { // Artist Info

      const currentArtworkId = await this.getArtworkId(visitId, currentArtworkIndex);
      const artwork = await Artwork.findById(currentArtworkId).populate('defaultItems').populate('artists').exec();
      if (!artwork) {
        throw new Error(`Opera con ID "${currentArtworkId}" non trovata.`);
      }
      if (!artwork.artists || artwork.artists.length === 0) {
        throw new Error(`Nessun artista associato all'opera "${artwork.title}".`);
      }

      const artist = artwork.artists.find(a => a.name.toLowerCase() === targetArtist.toLowerCase());
      if (!artist) {
        throw new Error(`Artista "${targetArtist}" non trovato per l'opera "${artwork.title}".`);
      }

      return LLMService.nonItemArtistInfo(artist, artwork, tone, length, language);
    } else {
      throw new Error('Nessuna azione non-item valida fornita.');
    }
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
}

module.exports = NavigatorService;
