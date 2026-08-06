const User = require('../data/model/User');
const Artist = require('../data/model/Artist');
const Item = require('../data/model/Item');
const Artwork = require('../data/model/Artwork');
const Visit = require('../data/model/Visit');
const Museum = require('../data/model/Museum');
const LLMService = require('./LLMService');

// CHECK: Forse le informazioni base degli artwork, es titolo, anno, artista, posizione..., andrebbero inclusi e non lo sono. Danno informazioni di contesto al modello LLM sull'opera stessa che può usare es in caso di generazione di item

class NavigatorService {

  /**
   * Recupera i dettagli completi di una visita con opere, item ed il relativo museo
   */
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
  /**
   * RISOLUZIONE ITEM CON STRATEGIA CACHE-FIRST:
   * 1. Cerca prima nel DB MongoDB se esiste già un Item con tono e lingua desiderati.
   * 2. Se non esiste, chiama LLMService per generarlo, lo salva su MongoDB e lo restituisce.
   */
  static async getOrGenerateItem(artworkId, tone = 'medium', length = 30, language = 'it') {
    const artwork = await Artwork.findById(artworkId)
      .populate('items')
      .populate('artists')
      .exec();

    if (!artwork) {
      throw new Error(`Opera con ID "${artworkId}" non trovata.`);
    }

    // 1. Cerca item nel DB tra quelli dell'opera
    let matchingItem = (artwork.items || []).find(item => 
      item.tone === tone && (item.language || 'it') === language
    );

    if (matchingItem) {
      return { item: matchingItem, fromCache: true };
    }

    // TODO: Se item non trovato perchè non corrispondono lingua e/o tono, Ricicliamo il testo esistente mandando al modello llm e diciamo a lui di adattarlo al tono e/o lingua desiderati. Questo per evitare di generare un testo completamente nuovo se ne esiste già uno simile.
    const existingText = (artwork.items && artwork.items.length > 0) ? artwork.items[0].description : '';

    // Contesto dell'opera completo per dare informazioni di contesto al modello LLM
    const artworkContext = {
      title: artwork.title,
      startYear: artwork.startYear,
      endYear: artwork.endYear,
      artists: (artwork.artists || []).map(a => `${a.name} ${a.surname || ''}`).join(', '),
      artisticCurrents: artwork.artisticCurrents || [],
      details: artwork.details,
      location: artwork.location
    };

    // 2. Se non presente nel DB, genera con LLMService adattando il testo esistente o il contesto dell'opera
    const generatedText = await LLMService.generateAdaptedItem(artworkContext, tone, length, language, existingText);

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

    // Collega il nuovo Item all'opera
    artwork.items.push(savedItem._id);
    await artwork.save();

    return { item: savedItem, fromCache: false };
  }

  static async handleUserCommand({ inputText, visitId, currentArtworkIndex = 0, currentTone = 'medium', currentLanguage = 'it' }) {
    let visit = null;
    let museum = null;
    let artworks = [];
    let currentArtwork = null;

    if (visitId) {
      try {
        const details = await this.getVisitWithDetails(visitId);
        visit = details.visit;
        museum = details.museum;
        artworks = visit?.artworks || [];
        currentArtwork = artworks[currentArtworkIndex] || artworks[0] || null;
      } catch (err) {
        console.warn(`[NavigatorService] Avviso caricamento visita "${visitId}":`, err.message);
      }
    }

    // MAIN CORE -> restituisce la risposta dell'llm al comando in input
    const nlpResult = await LLMService.parseNaturalLanguageCommand(inputText, {
      currentArtworkTitle: currentArtwork?.title,
      currentTone,
      currentLanguage,
      museumName: museum?.name
    });

    let newIndex = currentArtworkIndex;
    let newTone = currentTone;
    let newLanguage = currentLanguage;
    let logisticalDirections = null;
    let actionMessage = '';

    const VALID_TONES = ['infantile', 'simple', 'medium', 'advanced', 'technical'];
    const sanitizeTone = (tone, fallback) => (tone && typeof tone === 'string' && tone !== 'null' && VALID_TONES.includes(tone.toLowerCase())) ? tone.toLowerCase() : fallback;

    // TODO: Gestione dei tono troppo semplice, non c'è tutta la gamma dei toni possibili che sono nella truttura tono dell'item => enum: ['infantile', 'simple', 'medium', 'advanced', 'technical']
    switch (nlpResult.intent) {
      case 'SIMPLIFY_TONE': {
        const curIdx = VALID_TONES.indexOf(currentTone);
        const targetTone = nlpResult.requestedTone;
        if (targetTone && VALID_TONES.includes(targetTone.toLowerCase())) {
          newTone = targetTone.toLowerCase();
        } else if (curIdx > 0) {
          newTone = VALID_TONES[curIdx - 1];
        } else {
          newTone = 'infantile';
        }
        actionMessage = `Tono semplificato in "${newTone}".`;
        break;
      }

      case 'ADVANCE_TONE': {
        const curIdx = VALID_TONES.indexOf(currentTone);
        const targetTone = nlpResult.requestedTone;
        if (targetTone && VALID_TONES.includes(targetTone.toLowerCase())) {
          newTone = targetTone.toLowerCase();
        } else if (curIdx >= 0 && curIdx < VALID_TONES.length - 1) {
          newTone = VALID_TONES[curIdx + 1];
        } else {
          newTone = 'technical';
        }
        actionMessage = `Tono avanzato impostato a "${newTone}".`;
        break;
      }

      case 'SHORTEN_LENGTH': {
        const targetLen = nlpResult.requestedLength || 15;
        actionMessage = `Durata spiegazione ridotta a circa ${targetLen} secondi.`;
        break;
      }

      case 'EXTEND_LENGTH': {
        const targetLen = nlpResult.requestedLength || 60;
        actionMessage = `Durata spiegazione estesa a circa ${targetLen} secondi.`;
        break;
      }

      case 'CHANGE_LANGUAGE': {
        newLanguage = (nlpResult.requestedLanguage || 'en').toLowerCase();
        actionMessage = `Lingua della spiegazione impostata a "${newLanguage.toUpperCase()}".`;
        break;
      }

      case 'NEXT_ITEM':
        if (artworks.length > 0 && currentArtworkIndex < artworks.length - 1) {
          newIndex = currentArtworkIndex + 1;
          const nextArtwork = artworks[newIndex];
          logisticalDirections = await LLMService.generateLogisticalDirections(
            currentArtwork?.location || { room: 'Sala Corrente' },
            nextArtwork?.location || { room: 'Prossima Sala' },
            { floors: museum?.floors, services: museum?.services }
          );
          actionMessage = `Avanzamento all'opera successiva (${newIndex + 1}/${artworks.length}).`;
        } else if (artworks.length > 0) {
          actionMessage = 'Sei già all\'ultima opera della visita.';
        } else {
          actionMessage = 'Nessuna visita attiva selezionata per avanzare alle opere.';
        }
        break;

      case 'PREVIOUS_ITEM':
        if (artworks.length > 0 && currentArtworkIndex > 0) {
          newIndex = currentArtworkIndex - 1;
          actionMessage = `Ritorno all'opera precedente (${newIndex + 1}/${artworks.length}).`;
        } else if (artworks.length > 0) {
          actionMessage = 'Sei alla prima opera della visita.';
        } else {
          actionMessage = 'Nessuna visita attiva selezionata.';
        }
        break;

      // TODO: anche la gestione dei punti di interesse è molto semplificata e non rispetta le possibilità dei tipi. Infatti la struttura dei punti di interesse è molto più complessa => enum: ['toilette', 'disabled_toilette', 'bar', 'restaurant', 'shop', 'entrance', 'exit', 'emergency_exit', 'elevator', 'stairs', 'ticket_office', 'info_point', 'cloakroom', 'first_aid']. Completare 
      case 'NAVIGATE_POI': {
        const poiType = nlpResult.targetPoiType || 'toilette';
        const poiList = museum?.pointsOfInterest || [];
        
        // Cerca prima il tipo esatto
        let poi = poiList.find(p => p.type === poiType);
        
        // Fallback affini se il tipo esatto non è presente nel museo
        if (!poi) {
          if (poiType === 'disabled_toilette') poi = poiList.find(p => p.type === 'toilette');
          else if (poiType === 'restaurant') poi = poiList.find(p => p.type === 'bar');
          else if (poiType === 'emergency_exit') poi = poiList.find(p => p.type === 'exit');
          else if (poiType === 'stairs') poi = poiList.find(p => p.type === 'elevator');
          else if (poiType === 'cloakroom' || poiType === 'info_point') poi = poiList.find(p => p.type === 'ticket_office');
        }

        if (!poi) {
          poi = { name: poiType.replace('_', ' ').toUpperCase(), floor: 'Piano Terra', room: 'Atrio Principale' };
        }

        logisticalDirections = await LLMService.generateLogisticalDirections(
          currentArtwork?.location || { room: 'Sala Corrente' },
          poi,
          { floors: museum?.floors, services: museum?.services }
        );
        actionMessage = `Indicazioni logistiche per raggiungere: ${poi.name || poiType}.`;
        break;
      }

      case 'ASK_AUTHOR_INFO': {
        const artist = (currentArtwork?.artists && currentArtwork.artists.length > 0) 
          ? currentArtwork.artists[0] 
          : { name: 'Autore non specificato' };
        actionMessage = `Artista dell'opera: ${artist.name} ${artist.surname || ''}. Correnti: ${(artist.artisticCurrents || []).join(', ')}`;
        break;
      }

      default:
        actionMessage = `Comando ricevuto: "${inputText}". Intent: ${nlpResult.intent}`;
        break;
    }

    const validTone = sanitizeTone(newTone, currentTone || 'medium');
    const activeArtwork = artworks[newIndex] || currentArtwork || null;
    const targetLength = nlpResult.requestedLength || 30;

    let itemOutput = null;
    if (activeArtwork && activeArtwork._id) {
      const { item, fromCache } = await this.getOrGenerateItem(activeArtwork._id, validTone, targetLength, newLanguage);
      itemOutput = {
        id: item._id,
        description: LLMService.extractToneText(item.description, validTone),
        tone: item.tone,
        length: item.length,
        language: item.language,
        isAIGenerated: item.isAIGenerated,
        authorName: item.authorName,
        fromCache
      };
    }

    // Risposta parlata completa per la sintesi TTS
    let spokenResponse = actionMessage;
    if (logisticalDirections) {
      spokenResponse = `${actionMessage ? actionMessage + ' ' : ''}${logisticalDirections}`;
    } else if (itemOutput && itemOutput.description) {
      spokenResponse = itemOutput.description;
    }

    return {
      nlpResult,
      actionMessage,
      spokenResponse,
      currentArtworkIndex: newIndex,
      activeTone: validTone,
      activeLanguage: newLanguage,
      activeArtwork: activeArtwork ? {
        id: activeArtwork._id,
        title: activeArtwork.title,
        location: activeArtwork.location,
        qrCode: activeArtwork.qrCode,
        artists: activeArtwork.artists
      } : null,
      item: itemOutput,
      activeProviderName: LLMService.getActiveProviderName(),
      logisticalDirections
    };
  }
}

module.exports = NavigatorService;
