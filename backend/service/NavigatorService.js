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
    const artwork = await Artwork.findById(artworkId).populate('items').exec();
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
  
    // 2. Se non presente nel DB, genera con LLMService
    const generatedText = await LLMService.generateAdaptedItem(artwork.title, tone, length, language);

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

  /**
   * ESECUZIONE COMANDO VOCALE / TESTUALE IN LINGUAGGIO NATURALE
   */
  static async handleUserCommand({ inputText, visitId, currentArtworkIndex = 0, currentTone = 'medium' }) {
    const { visit, museum } = await this.getVisitWithDetails(visitId);
    const artworks = visit.artworks || [];
    const currentArtwork = artworks[currentArtworkIndex] || artworks[0];

    // 1. Riconosce l'intent tramite LLM
    const nlpResult = await LLMService.parseNaturalLanguageCommand(inputText, {
      currentArtworkTitle: currentArtwork?.title,
      currentTone,
      museumName: museum?.name
    });

    let newIndex = currentArtworkIndex;
    let newTone = currentTone;
    let logisticalDirections = null;
    let actionMessage = '';


    const VALID_TONES = ['infantile', 'simple', 'technical', 'scientific', 'medium', 'advanced', 'expert'];
    const sanitizeTone = (tone, fallback) => (tone && typeof tone === 'string' && tone !== 'null' && VALID_TONES.includes(tone.toLowerCase())) ? tone.toLowerCase() : fallback;

    // TODO: Gestione dei tono troppo semplice, non c'è tutta la gamma dei toni possibili che sono nella truttura tono dell'item => enum: ['infantile', 'simple', 'medium', 'advanced', 'technical']
    switch (nlpResult.intent) {
      case 'SIMPLIFY_TONE':
        newTone = sanitizeTone(nlpResult.requestedTone, currentTone === 'advanced' ? 'medium' : currentTone === 'medium' ? 'simple' : 'infantile');
        actionMessage = `Tono semplificato in "${newTone}".`;
        break;

      case 'ADVANCE_TONE':
        newTone = sanitizeTone(nlpResult.requestedTone, currentTone === 'infantile' ? 'simple' : currentTone === 'simple' ? 'medium' : 'advanced');
        actionMessage = `Tono avanzato impostato a "${newTone}".`;
        break;

      case 'NEXT_ITEM':
        if (currentArtworkIndex < artworks.length - 1) {
          newIndex = currentArtworkIndex + 1;
          const nextArtwork = artworks[newIndex];
          logisticalDirections = await LLMService.generateLogisticalDirections(
            currentArtwork?.location || { room: 'Sala Corrente' },
            nextArtwork?.location || { room: 'Prossima Sala' },
            { floors: museum?.floors, services: museum?.services }
          );
          actionMessage = `Avanzamento all'opera successiva (${newIndex + 1}/${artworks.length}).`;
        } else {
          actionMessage = 'Sei già all\'ultima opera della visita.';
        }
        break;

      case 'PREVIOUS_ITEM':
        if (currentArtworkIndex > 0) {
          newIndex = currentArtworkIndex - 1;
          actionMessage = `Ritorno all'opera precedente (${newIndex + 1}/${artworks.length}).`;
        } else {
          actionMessage = 'Sei alla prima opera della visita.';
        }
        break;

      // TODO: anche la gestione dei punti di interesse è molto semplificata e non rispetta le possibilità dei tipi. Infatti la struttura dei punti di interesse è molto più complessa => enum: ['toilette', 'disabled_toilette', 'bar', 'restaurant', 'shop', 'entrance', 'exit', 'emergency_exit', 'elevator', 'stairs', 'ticket_office', 'info_point', 'cloakroom', 'first_aid']. Completare 
      case 'NAVIGATE_POI': {
        const poiType = nlpResult.targetPoiType || 'toilette';
        const poi = (museum?.pointsOfInterest || []).find(p => p.type === poiType) || {
          name: poiType.toUpperCase(),
          floor: 'Piano Terra',
          room: 'Atrio Ingresso'
        };
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
    const activeArtwork = artworks[newIndex] || currentArtwork;
    const { item, fromCache } = await this.getOrGenerateItem(activeArtwork._id, validTone);

    return {
      nlpResult,
      actionMessage,
      currentArtworkIndex: newIndex,
      activeTone: newTone,
      activeArtwork: {
        id: activeArtwork._id,
        title: activeArtwork.title,
        location: activeArtwork.location,
        qrCode: activeArtwork.qrCode,
        artists: activeArtwork.artists
      },
      item: {
        id: item._id,
        description: item.description,
        tone: item.tone,
        length: item.length,
        language: item.language,
        isAIGenerated: item.isAIGenerated,
        authorName: item.authorName,
        fromCache
      },
      logisticalDirections
    };
  }
}

module.exports = NavigatorService;
