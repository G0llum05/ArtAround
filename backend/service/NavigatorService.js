// const User = require('../data/model/User');
// const Artist = require('../data/model/Artist');
const Item = require('../data/model/Item');
const Artwork = require('../data/model/Artwork');
const Visit = require('../data/model/Visit');
const Museum = require('../data/model/Museum');
const LLMService = require('./LLMService');
const ItemMapper = require('../data/mapper/ItemMapper');
const ArtworkMapper = require('../data/mapper/ArtworkMapper');


class NavigatorService {

  static async navigatorHandler(requestDTO) {
    const {
      language,
      length,
      tone,
      visitId,
      currentArtworkIndex,
      actionType,
      audioFile,
      itemAction,
      targetPoiType,
      targetArtist
    } = requestDTO;

    switch (actionType) {
      case 'AUDIO_ACTION':
        return await this.audioActionHandler(audioFile, visitId, currentArtworkIndex, tone, length, language);
      case 'ITEM_ACTION':
        return await this.itemActionHandler(itemAction, visitId, currentArtworkIndex, tone, length, language);
      case 'NON_ITEM_ACTION':
        return await this.nonItemActionHandler(targetPoiType, targetArtist, visitId, currentArtworkIndex, tone, length, language);
      default:
        throw new Error(`Tipo di azione non valido: ${actionType}`);
    }
  }

  static async audioActionHandler(audioFile, visitId, currentArtworkIndex, tone, length, language) { }

  /**
   * retituisce item con scelte cache-first:
   * - Cerca prima nel DB se esiste già l'item giusto
   * - Se non esiste cerca item simili e genera un nuovo item con dati esistenti
   * - Se non esiste proprio niente non da linee guida all'llm e lo genera con conoscenze generali
   */
  static async itemActionHandler(itemAction, visitId, currentArtworkIndex, tone, length, language) {
    let targetIndex = currentArtworkIndex;

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
    }

    const targetArtworkId = await this.getArtworkId(visitId, targetIndex);
    if (!targetArtworkId) {
      throw new Error(`Nessuna opera trovata per la visita "${visitId}" all'indice "${targetIndex}".`);
    }

    const item = await this.getOrGenerateItem(targetArtworkId, tone, length, language);

    console.log('\n\x1b[36m🔍 [DEBUG SERVICE] Contenuto della descrizione:\x1b[0m');
    console.log(`   • Tipo dato: ${typeof item}`);
    console.log(`   • Descrizione: "${item.description}"\n`);

    return item.description ? item.description : null;
  }


  static async getOrGenerateItem(artworkId, tone, length, language) {

    const artwork = await Artwork.findById(artworkId).populate('items').populate('artists').exec();
    if (!artwork) {
      throw new Error(`Opera con ID "${artworkId}" non trovata.`);
    }

    // Item esistente
    const matchingItem = await this.getItem(artwork, tone, language, length);
    if (matchingItem) {
      console.log(`\n\x1b[32m✅ [DEBUG SERVICE] Item trovato nel DB per opera "${artwork.title}" con tono "${tone}", lingua "${language}" e lunghezza "${length}".\x1b[0m\n`);
      return matchingItem;
    }

    // Se item non trovato ricicliamo il testo esistente di item sinonimi
    const rawExistingSimilarItem = this.getAvailableContentIfExists(artwork, tone, language, length);
    const existingSimilarItem = ItemMapper.toItemLLMRequestDTO(rawExistingSimilarItem);
    console.log(`\n\x1b[33m⚠️ [DEBUG SERVICE] Nessun item esatto trovato per opera "${artwork.title}" con tono "${tone}", lingua "${language}" e lunghezza "${length}".\x1b[0m\n`);

    const artworkContext = ArtworkMapper.toArtworkLLMRequestDTO(artwork);

    const generatedText = await LLMService.generateItem(tone, length, language, existingSimilarItem, artworkContext);

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
    artwork.items.push(savedItem._id);
    await artwork.save();

    return savedItem;
  }

  static async nonItemActionHandler(targetPoiType, targetArtist, visitId, currentArtworkIndex, tone, length, language) { }



  static async getArtworkId(visitId, currentArtworkIndex) {
    const visit = await Visit.findById(visitId).populate('artworks').exec();
    if (!visit) {
      throw new Error(`Visita con ID "${visitId}" non trovata.`);
    }

    const artworks = visit.artworks || [];
    if (currentArtworkIndex < 0 || currentArtworkIndex >= artworks.length) {
      throw new Error(`Indice dell'opera "${currentArtworkIndex}" fuori dai limiti per la visita "${visitId}".`);
    }

    return artworks[currentArtworkIndex]._id;
  }


  static async getItem(artwork, tone, language, length) {

    const items = artwork.items || [];
    const targetLanguage = (language || 'it').toLowerCase();
    const targetLength = parseInt(length, 10);

    return items.find(item =>
      item.tone === tone && item.language === targetLanguage && item.length === targetLength
    );
  }

  // TODO CHECK
  // !!! PRESTARE ATTENZIONE !!! La scelta dei valori è ben precisa, 13, 10, 5, 1. Se tot - 10 c'è lunghezza. Se tot (o rimanente) - 5 c'è tono. Se tot (o rimanente) - 3 c'è lunghezza giusta. Se tot (o rimanente) - 1 c'è lingua giusta. In questo modo si può dire nel prompt che cosa è stato trovato e cosa no e allo stesso tempo lunghezza maggiore + lingua vince su lunghezza giusta (e anche + lingua giusta)
  static getAvailableContentIfExists(artwork, tone, language, length) {
    const items = artwork?.items || [];
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


  // CHECK











  // CHECK COMPLETO
  //   /**
  //    * Recupera i dettagli completi di una visita con opere, item ed il relativo museo
  //    */
  static async getVisitWithDetails(visitId) {
    const visit = await Visit.findById(visitId)
      .populate({
        path: 'artworks',
        populate: [
          { path: 'items' },
          { path: 'artists' }
        ]
      })
      .exec();

    if (!visit) {
      throw new Error(`Visita con ID "${visitId}" non trovata.`);
    }

    // Trova il museo collegato a questa visita
    const museum = await Museum.findOne({ visits: visitId })
      .populate('pointsOfInterest')
      .exec();

    return { visit, museum };
  }






  //
  //
  //
  //   static async handleUserCommand({ inputText, visitId, currentArtworkIndex = 0, currentTone = 'medium', currentLanguage = 'it' }) {
  //     let visit = null;
  //     let museum = null;
  //     let artworks = [];
  //     let currentArtwork = null;
  //
  //     if (!visitId) {
  //       try {
  //         const firstVisit = await Visit.findOne({ isActive: { $ne: false } }).exec();
  //         if (firstVisit) {
  //           visitId = firstVisit._id.toString();
  //         }
  //       } catch (e) {
  //         console.warn('[NavigatorService] Impossibile recuperare visita di fallback:', e.message);
  //       }
  //     }
  //
  //     if (visitId) {
  //       try {
  //         const details = await this.getVisitWithDetails(visitId);
  //         visit = details.visit;
  //         museum = details.museum;
  //         artworks = visit?.artworks || [];
  //         currentArtwork = artworks[currentArtworkIndex] || artworks[0] || null;
  //       } catch (err) {
  //         console.warn(`[NavigatorService] Avviso caricamento visita "${visitId}":`, err.message);
  //       }
  //     }
  //
  //     // MAIN CORE -> restituisce la risposta dell'llm al comando in input
  //     const nlpResult = await LLMService.parseNaturalLanguageCommand(inputText, {
  //       currentArtworkTitle: currentArtwork?.title,
  //       currentTone,
  //       currentLanguage,
  //       museumName: museum?.name
  //     });
  //
  //     let newIndex = currentArtworkIndex;
  //     let newTone = currentTone;
  //     let newLanguage = currentLanguage;
  //     let logisticalDirections = null;
  //     let actionMessage = '';
  //
  //     const VALID_TONES = ['infantile', 'simple', 'medium', 'advanced', 'technical'];
  //     const sanitizeTone = (tone, fallback) => (tone && typeof tone === 'string' && tone !== 'null' && VALID_TONES.includes(tone.toLowerCase())) ? tone.toLowerCase() : fallback;
  //
  //     // TODO: Gestione dei tono troppo semplice, non c'è tutta la gamma dei toni possibili che sono nella truttura tono dell'item => enum: ['infantile', 'simple', 'medium', 'advanced', 'technical']
  //     switch (nlpResult.intent) {
  //       case 'SIMPLIFY_TONE': {
  //         const curIdx = VALID_TONES.indexOf(currentTone);
  //         const targetTone = nlpResult.requestedTone;
  //         if (targetTone && VALID_TONES.includes(targetTone.toLowerCase())) {
  //           newTone = targetTone.toLowerCase();
  //         } else if (curIdx > 0) {
  //           newTone = VALID_TONES[curIdx - 1];
  //         } else {
  //           newTone = 'infantile';
  //         }
  //         actionMessage = `Tono semplificato in "${newTone}".`;
  //         break;
  //       }
  //
  //       case 'ADVANCE_TONE': {
  //         const curIdx = VALID_TONES.indexOf(currentTone);
  //         const targetTone = nlpResult.requestedTone;
  //         if (targetTone && VALID_TONES.includes(targetTone.toLowerCase())) {
  //           newTone = targetTone.toLowerCase();
  //         } else if (curIdx >= 0 && curIdx < VALID_TONES.length - 1) {
  //           newTone = VALID_TONES[curIdx + 1];
  //         } else {
  //           newTone = 'technical';
  //         }
  //         actionMessage = `Tono avanzato impostato a "${newTone}".`;
  //         break;
  //       }
  //
  //       case 'SHORTEN_LENGTH': {
  //         const targetLen = nlpResult.requestedLength || 15;
  //         actionMessage = `Durata spiegazione ridotta a circa ${targetLen} secondi.`;
  //         break;
  //       }
  //
  //       case 'EXTEND_LENGTH': {
  //         const targetLen = nlpResult.requestedLength || 60;
  //         actionMessage = `Durata spiegazione estesa a circa ${targetLen} secondi.`;
  //         break;
  //       }
  //
  //       case 'CHANGE_LANGUAGE': {
  //         newLanguage = (nlpResult.requestedLanguage || 'en').toLowerCase();
  //         actionMessage = `Lingua della spiegazione impostata a "${newLanguage.toUpperCase()}".`;
  //         break;
  //       }
  //
  //       case 'NEXT_ITEM':
  //         if (artworks.length > 0 && currentArtworkIndex < artworks.length - 1) {
  //           newIndex = currentArtworkIndex + 1;
  //           const nextArtwork = artworks[newIndex];
  //           logisticalDirections = await LLMService.generateLogisticalDirections(
  //             currentArtwork?.location || { room: 'Sala Corrente' },
  //             nextArtwork?.location || { room: 'Prossima Sala' },
  //             { floors: museum?.floors, services: museum?.services }
  //           );
  //           actionMessage = `Avanzamento all'opera successiva (${newIndex + 1}/${artworks.length}).`;
  //         } else if (artworks.length > 0) {
  //           actionMessage = 'Sei già all\'ultima opera della visita.';
  //         } else {
  //           actionMessage = 'Nessuna visita attiva selezionata per avanzare alle opere.';
  //         }
  //         break;
  //
  //       case 'PREVIOUS_ITEM':
  //         if (artworks.length > 0 && currentArtworkIndex > 0) {
  //           newIndex = currentArtworkIndex - 1;
  //           actionMessage = `Ritorno all'opera precedente (${newIndex + 1}/${artworks.length}).`;
  //         } else if (artworks.length > 0) {
  //           actionMessage = 'Sei alla prima opera della visita.';
  //         } else {
  //           actionMessage = 'Nessuna visita attiva selezionata.';
  //         }
  //         break;
  //
  //       // TODO: anche la gestione dei punti di interesse è molto semplificata e non rispetta le possibilità dei tipi. Infatti la struttura dei punti di interesse è molto più complessa => enum: ['toilette', 'disabled_toilette', 'bar', 'restaurant', 'shop', 'entrance', 'exit', 'emergency_exit', 'elevator', 'stairs', 'ticket_office', 'info_point', 'cloakroom', 'first_aid']. Completare 
  //       case 'NAVIGATE_POI': {
  //         const poiType = nlpResult.targetPoiType || 'toilette';
  //         const poiList = museum?.pointsOfInterest || [];
  //
  //         // Cerca prima il tipo esatto
  //         let poi = poiList.find(p => p.type === poiType);
  //
  //         // Fallback affini se il tipo esatto non è presente nel museo
  //         if (!poi) {
  //           if (poiType === 'disabled_toilette') poi = poiList.find(p => p.type === 'toilette');
  //           else if (poiType === 'restaurant') poi = poiList.find(p => p.type === 'bar');
  //           else if (poiType === 'emergency_exit') poi = poiList.find(p => p.type === 'exit');
  //           else if (poiType === 'stairs') poi = poiList.find(p => p.type === 'elevator');
  //           else if (poiType === 'cloakroom' || poiType === 'info_point') poi = poiList.find(p => p.type === 'ticket_office');
  //         }
  //
  //         if (!poi) {
  //           poi = { name: poiType.replace('_', ' ').toUpperCase(), floor: 'Piano Terra', room: 'Atrio Principale' };
  //         }
  //
  //         logisticalDirections = await LLMService.generateLogisticalDirections(
  //           currentArtwork?.location || { room: 'Sala Corrente' },
  //           poi,
  //           { floors: museum?.floors, services: museum?.services }
  //         );
  //         actionMessage = `Indicazioni logistiche per raggiungere: ${poi.name || poiType}.`;
  //         break;
  //       }
  //
  //       case 'ASK_AUTHOR_INFO': {
  //         const artist = (currentArtwork?.artists && currentArtwork.artists.length > 0)
  //           ? currentArtwork.artists[0]
  //           : { name: 'Autore non specificato' };
  //         actionMessage = `Artista dell'opera: ${artist.name} ${artist.surname || ''}. Correnti: ${(artist.artisticCurrents || []).join(', ')}`;
  //         break;
  //       }
  //
  //       default:
  //         actionMessage = `Comando ricevuto: "${inputText}". Intent: ${nlpResult.intent}`;
  //         break;
  //     }
  //
  //     const validTone = sanitizeTone(newTone, currentTone || 'medium');
  //     const activeArtwork = artworks[newIndex] || currentArtwork || null;
  //     const targetLength = nlpResult.requestedLength || 30;
  //
  //     let itemOutput = null;
  //     if (activeArtwork && activeArtwork._id) {
  //       const { item, fromCache } = await this.getOrGenerateItem(activeArtwork._id, validTone, targetLength, newLanguage);
  //       itemOutput = {
  //         id: item._id,
  //         description: LLMService.extractToneText(item.description, validTone),
  //         tone: item.tone,
  //         length: item.length,
  //         language: item.language,
  //         isAIGenerated: item.isAIGenerated,
  //         authorName: item.authorName,
  //         fromCache
  //       };
  //     }
  //
  //     // Risposta parlata completa per la sintesi TTS
  //     let spokenResponse = actionMessage;
  //     if (logisticalDirections) {
  //       spokenResponse = `${actionMessage ? actionMessage + ' ' : ''}${logisticalDirections}`;
  //     } else if (itemOutput && itemOutput.description) {
  //       spokenResponse = itemOutput.description;
  //     }
  //
  //     return {
  //       nlpResult,
  //       actionMessage,
  //       spokenResponse,
  //       currentArtworkIndex: newIndex,
  //       activeTone: validTone,
  //       activeLanguage: newLanguage,
  //       activeArtwork: activeArtwork ? {
  //         id: activeArtwork._id,
  //         title: activeArtwork.title,
  //         location: activeArtwork.location,
  //         qrCode: activeArtwork.qrCode,
  //         artists: activeArtwork.artists
  //       } : null,
  //       item: itemOutput,
  //       activeProviderName: LLMService.getActiveProviderName(),
  //       logisticalDirections
  //     };
  //   }
}

module.exports = NavigatorService;
