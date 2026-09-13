const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const Sanitizer = require('../utils/Sanitizer');

function replacePlaceholders(template, replacements = {}) {
  if (!template || typeof template !== 'string') return '';

  let result = template;
  for (const param in replacements) {
    const val = replacements[param];
    // Se il valore è un oggetto complex, mantiene SIA chiavi SIA valori in formato JSON leggibile
    const valStr = typeof val === 'object' && val !== null
      ? JSON.stringify(val, null, 2)
      : String(val ?? '');

    const regex = new RegExp(`\\{\\{\\s*${param}\\s*\\}\\}`, 'g');
    result = result.replace(regex, valStr);
  }

  return result;
}

function promptHandler(key, replacements = {}) {
  try {
    const promptsPath = path.join(__dirname, '../config/llm-prompts.json');
    if (fs.existsSync(promptsPath)) {
      promptsConfig = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
    }
  } catch (e) {
    console.warn('[LLMService] Impossibile caricare llm-prompts.json, utilizzo prompt di default.');
  }

  let template = '';

  switch (key) {
    case 'generalContext':
      template = promptsConfig?.generalContext;
      break;

    case 'generateItem':
      template = promptsConfig?.generateItem;
      break;

    case 'existingSimilarItem':
      template = promptsConfig?.existingSimilarItem;
      break;

    case 'tellMeMore':
      template = promptsConfig?.tellMeMore;
      break;

    case 'artistInfo':
      template = promptsConfig?.artistInfo;
      break;

    case 'POI':
      template = promptsConfig?.POI;
      break;

    case 'museumInfo':
      template = promptsConfig?.museumInfo;
      break;

    case 'cultureInfo':
      template = promptsConfig?.cultureInfo;
      break;

    case 'parseCommand':
      template = promptsConfig?.parseCommand;
      break;

    default:
      template = promptsConfig?.[key] || '';
      break;
  }

  return replacePlaceholders(template, replacements);
}


class LLMService {

  static async generateItem(tone, length, language, existingSimilarItem, artworkContext, tellMeMore) {

    if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      // TODO
      return this._mockAdaptedItem(artworkContext.title, tone, length, language, existingSimilarItem);
    }

    try {
      let prompt = promptHandler('generalContext', { museum: artworkContext.museum, language });
      if (tellMeMore) {
        prompt += promptHandler('tellMeMore', { length, artworkContext: artworkContext?.title || '' });
      }
      if (existingSimilarItem) {
        prompt += promptHandler('existingSimilarItem', {
          tone,
          length,
          language,
          existingSimilarItem: existingSimilarItem,
          artworkContext: artworkContext
        });
      } else {
        prompt += promptHandler('generateItem', {
          tone,
          length,
          language,
          artworkContext: artworkContext
        });
      }

      console.log(`\x1b[36m[DEBUG AI] Prompt generazione item:\x1b[0m`, prompt);
      // TODO CHECK qua si DEVONO mettere dei controlli sui promtp che vengono fatti. Potrebbero esserci lingue sbagliate o lunghezze sbagliate
      const generated = await this._callLLMHandler(prompt);
      return Sanitizer.cleanTextForVoice(generated);
    } catch (err) {
      console.warn('[LLMService] Chiamata LLM generazione item fallita, utilizzo fallback mock:', err.message);
      return this._mockAdaptedItem(artworkContext.title, tone, length, language, existingSimilarItem);
    }
  }


  static async nonItemPOI(museumName, POI, language, tone) {
    if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      // TODO
      return Sanitizer.cleanTextForVoice(`Il ${POI} nel museo ${museumName} è un punto di interesse importante.`);
    }

    try {
      let prompt = promptHandler('generalContext', { museum: museumName, language });
      prompt += promptHandler('POI', {
        POI,
        tone,
        language
      });
      console.log(`\x1b[36m[DEBUG AI] Prompt generazione info POI:\x1b[0m`, prompt);
      const generated = await this._callLLMHandler(prompt);
      return Sanitizer.cleanTextForVoice(generated);
    } catch (err) {
      console.warn('[LLMService] Chiamata LLM generazione info POI fallita, utilizzo fallback mock:', err.message);
      return Sanitizer.cleanTextForVoice(`Il ${POI} nel museo ${museumName} è un punto di interesse importante.`);
    }
  }


  static async nonItemArtistInfo(artist, artworkContext, tone, length, language) {
    const artistName = artist?.name ? `${artist.name} ${artist.surname || ''}`.trim() : (typeof artist === 'string' ? artist : 'Autore');

    if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      return Sanitizer.cleanTextForVoice(`L'artista ${artistName} è l'autore dell'opera "${artworkContext?.title || 'Opera'}".`);
    }

    try {
      let prompt = promptHandler('generalContext', { museum: artworkContext?.museum || 'Museo', language });
      prompt += promptHandler('artistInfo', {
        artworkContext,
        artist,
        tone,
        length,
        language
      });

      console.log(`\x1b[36m[DEBUG AI] Prompt generazione info artista:\x1b[0m`, prompt);
      const generated = await this._callLLMHandler(prompt);
      return Sanitizer.cleanTextForVoice(generated);
    } catch (err) {
      console.warn('[LLMService] Chiamata LLM generazione info artista fallita, utilizzo fallback mock:', err.message);
      return Sanitizer.cleanTextForVoice(`L'artista ${artistName} è l'autore dell'opera "${artworkContext?.title || 'Opera'}".`);
    }
  }

  static async museumInfo(userQuery, museumContext, visitContext, tone, length, language) {
    if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      return this._mockMuseumInfo(userQuery, museumContext, visitContext, language);
    }

    try {
      let prompt = promptHandler('generalContext', { museum: museumContext?.name || 'Museo', language });
      prompt += promptHandler('museumInfo', {
        userQuery,
        museumContext,
        visitContext,
        tone,
        length,
        language
      });

      console.log(`\x1b[36m[DEBUG AI] Prompt generazione info museo/visita:\x1b[0m`, prompt);
      const generated = await this._callLLMHandler(prompt);
      return Sanitizer.cleanTextForVoice(generated);
    } catch (err) {
      console.warn('[LLMService] Chiamata LLM generazione info museo fallita, utilizzo fallback mock:', err.message);
      return this._mockMuseumInfo(userQuery, museumContext, visitContext, language);
    }
  }

  static async cultureInfo(userQuery, artworkContext, museumName, tone, length, language) {
    if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      return this._mockCultureInfo(userQuery, artworkContext, language);
    }

    try {
      let prompt = promptHandler('generalContext', { museum: museumName || artworkContext?.museum || 'Museo', language });
      prompt += promptHandler('cultureInfo', {
        userQuery,
        artworkContext,
        tone,
        length,
        language
      });

      console.log(`\x1b[36m[DEBUG AI] Prompt generazione culture info:\x1b[0m`, prompt);
      const generated = await this._callLLMHandler(prompt);
      return Sanitizer.cleanTextForVoice(generated);
    } catch (err) {
      console.warn('[LLMService] Chiamata LLM generazione culture info fallita, utilizzo fallback mock:', err.message);
      return this._mockCultureInfo(userQuery, artworkContext, language);
    }
  }

  static async generateQuiz(visitContext, artworksContext, settings = {}) {
    const { numberOfQuestions = 5, difficulty = 'medium', targetAge = 'studente', language = 'it' } = settings;

    if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      return this._mockGenerateQuiz(visitContext, artworksContext, settings);
    }

    try {
      const prompt = promptHandler('generateQuiz', {
        visitTitle: visitContext?.title || 'Visita Guidata',
        artworksContext: artworksContext || [],
        numberOfQuestions,
        difficulty,
        targetAge,
        language
      });

      console.log(`\x1b[36m[DEBUG AI] Prompt generazione quiz:\x1b[0m`, prompt);
      const rawResponse = await this._callLLMHandler(prompt);
      const parsed = this._extractJSON(rawResponse);
      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return parsed;
      }
      return this._mockGenerateQuiz(visitContext, artworksContext, settings);
    } catch (err) {
      console.warn('[LLMService] Errore generazione quiz LLM, uso fallback mock:', err.message);
      return this._mockGenerateQuiz(visitContext, artworksContext, settings);
    }
  }

  /**
  * @returns {Promise<{ actionType: string, itemAction?: string, targetPoiType?: string, targetArtist?: string, userQuery?: string }>}
  */
  static async parseIntentLLM(inputText, museum, artwork, tone, length, language) {
    const inputTextLower = (inputText || '').toLowerCase().trim();
    if (!inputTextLower) {
      return { actionType: 'ERROR', itemAction: null, targetPoiType: null, targetArtist: null, userQuery: null };
    }

    if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      console.log('[LLMService] Nessun LLM configurato in .env, uso rule engine mock per parsing intento');
      return this._mockParseCommand(inputTextLower, { museum, artwork, tone, length, language });
    }

    try {
      let prompt = promptHandler('parseCommand', {
        inputTextLower,
        museum: museum?.name || (typeof museum === 'string' ? museum : ''),
        artwork: artwork?.title || (typeof artwork === 'string' ? artwork : ''),
        artist: artwork?.artists?.map(a => a?.name ? `${a.name} ${a.surname || ''}`.trim() : a).join(', ') || '',
        tone,
        length,
        language
      });

      // response: actionType, itemAction/targetPoiType/targetArtist, userQuery, lingua se cambia, lunghezza se cambia, tono se cambia
      const response = await this._callLLMHandler(prompt);
      const parsed = this._cleanAndParseJSON(response);
      console.log(`\x1b[36m[DEBUG AI] Prompt parsing intento:\x1b[0m`, parsed);
      if (parsed && parsed.actionType) {
        const validActionTypes = ['ITEM_ACTION', 'MUSEUM_INFO', 'CULTURE_INFO', 'NON_ITEM_ACTION', 'UNKNOWN_ACTION'];
        if (!validActionTypes.includes(parsed.actionType)) {
          parsed.actionType = 'UNKNOWN_ACTION';
        }
        if (!parsed.userQuery && (parsed.actionType === 'MUSEUM_INFO' || parsed.actionType === 'CULTURE_INFO')) {
          parsed.userQuery = inputText;
        }
        return parsed;
      }
    } catch (err) {
      console.warn('[LLMService] Chiamata LLM parsing intento fallita, uso parser locale:', err.message);
    }

    return this._mockParseCommand(inputTextLower, { museum, artwork, tone, length, language });
  }


  //
  // /**
  //  * (1) PARSE COMMAND: Mappa frasi in linguaggio naturale sugli Intent del Vocabolario Controllato
  //  */
  // static async parseNaturalLanguageCommand(inputText, context = {}) {
  //   const textLower = (inputText || '').toLowerCase().trim();
  //
  //   // Provider Mock / Rule Engine intelligente di fallback
  //   if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
  //     return this._mockParseCommand(textLower, context);
  //   }
  //
  //   try {
  //     const prompt = getPrompt('parseCommand', { inputText, context });
  //     const responseText = await this._callLLMHandler(prompt);
  //     const parsed = this._cleanAndParseJSON(responseText);
  //     if (parsed) {
  //       return parsed;
  //     }
  //   } catch (err) {
  //     console.warn('[LLMService] Chiamata LLM fallita, utilizzo fallback mock:', err.message);
  //   }
  //
  //   return this._mockParseCommand(textLower, context);
  // }
  //
  // /**
  //  * LOGISTICAL DIRECTIONS: Genera indicazioni di navigazione tra posizioni e luoghi del museo
  //  */
  // static async generateLogisticalDirections(currentLocation, targetLocation, museumContext = {}) {
  //   if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
  //     return this._mockLogisticalDirections(currentLocation, targetLocation, museumContext);
  //   }
  //
  //   try {
  //     const prompt = getPrompt('logisticalDirections', { currentLocation, targetLocation, museumContext });
  //     return await this._callLLMHandler(prompt);
  //   } catch (err) {
  //     console.warn('[LLMService] Chiamata LLM indicazioni fallita, utilizzo fallback mock:', err.message);
  //     return this._mockLogisticalDirections(currentLocation, targetLocation, museumContext);
  //   }
  // }
  //
  //
  // /**
  //  * Helper per isolare esclusivamente il paragrafo del tono richiesto
  //  * qualora l'LLM o la cache memorizzino intestazioni multi-tono (es. **Simple**, **Infantile**)
  //  */
  // static extractToneText(fullText, requestedTone = 'medium') {
  //   if (!fullText || typeof fullText !== 'string') return fullText;
  //
  //   const toneLower = (requestedTone || 'medium').toLowerCase();
  //
  //   // Se il testo contiene marcatori come **Infantile** o **Simple** o ### Medium
  //   if (fullText.includes('**') || fullText.includes('###') || fullText.toLowerCase().includes('infantile')) {
  //     const sections = fullText.split(/(?=\*\*|\#\#\#)/);
  //     for (const sec of sections) {
  //       const firstLineLower = sec.split('\n')[0].toLowerCase();
  //       if (firstLineLower.includes(toneLower)) {
  //         // Rimuove l'intestazione markdown ed i ritorni a capo iniziali
  //         return sec.replace(/^(\*\*|###).+?(\*\*|\n)/, '').trim();
  //       }
  //     }
  //   }
  //
  //   return fullText.trim();
  // }
  //
  //
  // /**
  //  * SMART VISIT: Compone una visita personalizzata basata sui vincoli dell'utente
  //  */
  // static async generateSmartVisit(constraints, availableArtworks = []) {
  //   const titles = availableArtworks.map(a => a.title);
  //   if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
  //     return {
  //       suggestedArtworks: availableArtworks.slice(0, 3).map(a => a._id),
  //       rationale: `Visita veloce selezionata in base al tempo disponibile (${constraints.availableTimeMinutes || 30} min).`
  //     };
  //   }
  //
  //   try {
  //     const prompt = getPrompt('smartVisit', { titles, constraints });
  //     const responseText = await this._callLLMHandler(prompt);
  //     const parsed = this._cleanAndParseJSON(responseText);
  //     if (parsed) {
  //       const selectedIds = availableArtworks
  //         .filter(a => (parsed.selectedTitles || []).includes(a.title))
  //         .map(a => a._id);
  //       return {
  //         suggestedArtworks: selectedIds.length > 0 ? selectedIds : availableArtworks.slice(0, 3).map(a => a._id),
  //         rationale: parsed.rationale || 'Percorso ottimizzato in base ai vincoli stabiliti.'
  //       };
  //     }
  //   } catch (err) {
  //     console.warn('[LLMService] Chiamata Smart Visit fallita, utilizzo fallback mock:', err.message);
  //   }
  //
  //   return {
  //     suggestedArtworks: availableArtworks.slice(0, 3).map(a => a._id),
  //     rationale: 'Visita guidata generata in base alle opere principali ed al tempo stimato.'
  //   };
  // }
  //
  static _cleanAndParseJSON(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      return null;
    }
  }

  // =========================================================================
  // IMPLEMENTAZIONE FALLBACK MOCK OFFLINE
  // =========================================================================

  static _mockParseCommand(textLower, context = {}) {
    let language = null;
    let length = null;
    let tone = null;

    if (textLower.includes('inglese') || textLower.includes('english')) language = 'en';
    else if (textLower.includes('francese') || textLower.includes('french')) language = 'fr';
    else if (textLower.includes('spagnolo') || textLower.includes('spanish')) language = 'es';
    else if (textLower.includes('italiano') || textLower.includes('italian')) language = 'it';
    else if (textLower.includes('tedesco') || textLower.includes('deutsch') || textLower.includes('german')) language = 'de';

    if (textLower.includes('poco') || textLower.includes('accorcia') || textLower.includes('riduci') || textLower.includes('veloce') || textLower.includes('sintetico') || textLower.includes('breve') || textLower.includes('15')) {
      length = 15;
    } else if (textLower.includes('normale') || textLower.includes('medio') || textLower.includes('standard') || textLower.includes('30')) {
      length = 30;
    } else if (textLower.includes('abbastanza') || textLower.includes('allunga') || textLower.includes('più lunga') || textLower.includes('estendi') || textLower.includes('approfond') || textLower.includes('dettagli') || textLower.includes('60')) {
      length = 60;
    }

    if (textLower.includes('bambin') || textLower.includes('piccol') || textLower.includes('infantile')) {
      tone = 'infantile';
    } else if (textLower.includes('semplic') || textLower.includes('facile') || textLower.includes('studente')) {
      tone = 'simple';
    } else if (textLower.includes('tecnic') || textLower.includes('scientific') || textLower.includes('accademic') || textLower.includes('specialista')) {
      tone = 'technical';
    }

    if (textLower.includes('prossim') || textLower.includes('avanti') || textLower.includes('dopo') || textLower.includes('successiv') || textLower.includes('seguente')) {
      return { actionType: 'ITEM_ACTION', itemAction: 'NEXT_ITEM', targetPoiType: null, targetArtist: null, language, length, tone };
    }
    if (textLower.includes('indietro') || textLower.includes('prima') || textLower.includes('precedent')) {
      return { actionType: 'ITEM_ACTION', itemAction: 'PREVIOUS_ITEM', targetPoiType: null, targetArtist: null, language, length, tone };
    }
    if (textLower.includes('dimmi di più') || textLower.includes('maggiori info') || textLower.includes('continua')) {
      return { actionType: 'ITEM_ACTION', itemAction: 'TELL_ME_MORE', targetPoiType: null, targetArtist: null, language, length, tone };
    }

    // POI Parsing
    if (textLower.includes('bagno disabil') || textLower.includes('toilette disabil')) {
      return { actionType: 'NON_ITEM_ACTION', itemAction: null, targetPoiType: 'disabled_toilette', targetArtist: null, language, length, tone };
    }
    if (textLower.includes('bagno') || textLower.includes('toilette') || textLower.includes('wc')) {
      return { actionType: 'NON_ITEM_ACTION', itemAction: null, targetPoiType: 'toilette', targetArtist: null, language, length, tone };
    }
    if (textLower.includes('bar') || textLower.includes('caffè')) {
      return { actionType: 'NON_ITEM_ACTION', itemAction: null, targetPoiType: 'bar', targetArtist: null, language, length, tone };
    }
    if (textLower.includes('ristorante') || textLower.includes('pranzo') || textLower.includes('mangiare')) {
      return { actionType: 'NON_ITEM_ACTION', itemAction: null, targetPoiType: 'restaurant', targetArtist: null, language, length, tone };
    }
    if (textLower.includes('shop') || textLower.includes('negozio') || textLower.includes('bookshop') || textLower.includes('souvenir')) {
      return { actionType: 'NON_ITEM_ACTION', itemAction: null, targetPoiType: 'shop', targetArtist: null, language, length, tone };
    }
    if (textLower.includes('uscita di emergenza') || textLower.includes('antincendio')) {
      return { actionType: 'NON_ITEM_ACTION', itemAction: null, targetPoiType: 'emergency_exit', targetArtist: null, language, length, tone };
    }
    if (textLower.includes('uscita') || textLower.includes('uscire') || textLower.includes('fuori')) {
      return { actionType: 'NON_ITEM_ACTION', itemAction: null, targetPoiType: 'exit', targetArtist: null, language, length, tone };
    }
    if (textLower.includes('ingresso') || textLower.includes('entrata')) {
      return { actionType: 'NON_ITEM_ACTION', itemAction: null, targetPoiType: 'entrance', targetArtist: null, language, length, tone };
    }
    if (textLower.includes('ascensore')) {
      return { actionType: 'NON_ITEM_ACTION', itemAction: null, targetPoiType: 'elevator', targetArtist: null, language, length, tone };
    }
    if (textLower.includes('scale')) {
      return { actionType: 'NON_ITEM_ACTION', itemAction: null, targetPoiType: 'stairs', targetArtist: null, language, length, tone };
    }
    if (textLower.includes('bigliett') || textLower.includes('cassa')) {
      return { actionType: 'NON_ITEM_ACTION', itemAction: null, targetPoiType: 'ticket_office', targetArtist: null, language, length, tone };
    }
    if (textLower.includes('info') || textLower.includes('informazion')) {
      return { actionType: 'NON_ITEM_ACTION', itemAction: null, targetPoiType: 'info_point', targetArtist: null, language, length, tone };
    }
    if (textLower.includes('guardaroba') || textLower.includes('zaini') || textLower.includes('giacche')) {
      return { actionType: 'NON_ITEM_ACTION', itemAction: null, targetPoiType: 'cloakroom', targetArtist: null, language, length, tone };
    }
    if (textLower.includes('pronto soccorso') || textLower.includes('infermeria') || textLower.includes('medico')) {
      return { actionType: 'NON_ITEM_ACTION', itemAction: null, targetPoiType: 'first_aid', targetArtist: null, language, length, tone };
    }
    if (textLower.includes('autore') || textLower.includes('chi ha dipinto') || textLower.includes('chi l\'ha fatto') || textLower.includes('artista')) {
      return { actionType: 'NON_ITEM_ACTION', itemAction: null, targetPoiType: null, targetArtist: context?.artist || 'Autore', language, length, tone };
    }

    // Informazioni Museo / Visita (costi, biglietti, orari, servizi, accessibilità, trasporti)
    if (
      textLower.includes('costa') || textLower.includes('costo') || textLower.includes('prezzo') || textLower.includes('prezzi') ||
      textLower.includes('bigliett') || textLower.includes('tariff') || textLower.includes('quanto viene') ||
      textLower.includes('orari') || textLower.includes('orario') || textLower.includes('quando apre') ||
      textLower.includes('quando chiude') || textLower.includes('apert') || textLower.includes('chius') ||
      textLower.includes('wifi') || textLower.includes('wi-fi') || textLower.includes('parcheggio') ||
      textLower.includes('come arrivare') || textLower.includes('trasport') || textLower.includes('servizi') ||
      textLower.includes('accessibil') || textLower.includes('disabil') || textLower.includes('eventi') ||
      textLower.includes('mostre') || textLower.includes('regol') || textLower.includes('storia del museo')
    ) {
      return {
        actionType: 'MUSEUM_INFO',
        itemAction: null,
        targetPoiType: null,
        targetArtist: null,
        userQuery: textLower,
        language,
        length,
        tone
      };
    }

    // Domande Culturali, Movimenti artistici, Stili, Tecniche, Eventi storici
    if (
      textLower.includes('movimento') || textLower.includes('corrente') || textLower.includes('stile') ||
      textLower.includes('barocc') || textLower.includes('rinasciment') || textLower.includes('impressionis') ||
      textLower.includes('cubis') || textLower.includes('futuris') || textLower.includes('romanticis') ||
      textLower.includes('neoclassic') || textLower.includes('manieris') || textLower.includes('tecnica') ||
      textLower.includes('affresco') || textLower.includes('chiaroscuro') || textLower.includes('prospettiva') ||
      textLower.includes('contesto storico') || textLower.includes('periodo storico') || textLower.includes('cosa succedeva') ||
      textLower.includes('epoca') || textLower.includes('secolo') || textLower.includes('simbol') || textLower.includes('significato')
    ) {
      return {
        actionType: 'CULTURE_INFO',
        itemAction: null,
        targetPoiType: null,
        targetArtist: null,
        userQuery: textLower,
        language,
        length,
        tone
      };
    }

    // Spiegazione opera attuale
    if (textLower.includes('spieg') || textLower.includes('descriv') || textLower.includes('cos\'è') || textLower.includes('cosa rappresenta') || textLower.includes('parlami') || textLower.includes('opera') || textLower.includes('quadro') || textLower.includes('dipinto') || textLower.includes('statua') || textLower.includes('tappa') || textLower.includes('racconta') || textLower.includes('informazioni')) {
      return {
        actionType: 'ITEM_ACTION',
        itemAction: 'EXPLAIN_ITEM',
        targetPoiType: null,
        targetArtist: null,
        userQuery: null,
        language,
        length,
        tone
      };
    }

    // Modifica impostazioni (lingua, tono o durata)
    if (language !== null || length !== null || tone !== null) {
      return {
        actionType: 'ITEM_ACTION',
        itemAction: 'EXPLAIN_ITEM',
        targetPoiType: null,
        targetArtist: null,
        userQuery: null,
        language,
        length,
        tone
      };
    }

    // Fuori contesto / Non mappabile
    return {
      actionType: 'UNKNOWN_ACTION',
      itemAction: null,
      targetPoiType: null,
      targetArtist: null,
      userQuery: null,
      language,
      length,
      tone
    };
  }

  static _mockMuseumInfo(userQuery, museumContext, visitContext, language = 'it') {
    const pricesList = museumContext?.ticketInfo?.prices;
    if (pricesList && pricesList.length > 0) {
      const formatted = pricesList.map(p => `${p.planName || 'Intero'} ${p.price} euro`).join(', ');
      return `Il costo dei biglietti è: ${formatted}.`;
    }
    if (visitContext?.price !== undefined && visitContext?.price !== null) {
      return visitContext.price > 0
        ? `Il costo della visita è di ${visitContext.price} euro.`
        : 'La visita è gratuita.';
    }
    return 'L\'ingresso al museo è gratuito.';
  }

  static _mockCultureInfo(userQuery, artworkContext, language = 'it') {
    const currents = artworkContext?.artisticCurrents?.join(', ') || 'del suo periodo di appartenenza';
    const title = artworkContext?.title || 'quest\'opera';
    return `L'opera "${title}" si inserisce nel contesto artistico e culturale legato a ${currents}, riflettendo le innovazioni stilistiche, i canoni espressivi e gli eventi storici tipici della sua epoca.`;
  }

  static _mockGenerateQuiz(visitContext, artworksContext = [], settings = {}) {
    const { numberOfQuestions = 5, difficulty = 'medium', targetAge = 'studente', language = 'it' } = settings;
    const questions = [];
    const artworks = Array.isArray(artworksContext) && artworksContext.length > 0
      ? artworksContext
      : [{ title: 'Opera Principale', artistName: 'Autore Celebre', artisticCurrents: ['Rinascimento'] }];

    const count = Math.min(numberOfQuestions, Math.max(artworks.length, 3));
    for (let i = 0; i < count; i++) {
      const art = artworks[i % artworks.length];
      const title = art.title || `Opera ${i + 1}`;
      const artist = art.artistName || (art.artists && art.artists[0]?.name ? `${art.artists[0].name} ${art.artists[0].surname || ''}`.trim() : 'Autore sconosciuto');
      const currents = Array.isArray(art.artisticCurrents) && art.artisticCurrents.length > 0 ? art.artisticCurrents[0] : 'Arte Classica';

      if (i % 2 === 0) {
        questions.push({
          question: `Chi è l'autore dell'opera "${title}" ammirata durante il tour?`,
          options: [artist, 'Leonardo da Vinci', 'Caravaggio', 'Michelangelo Buonarroti'],
          correctAnswerIndex: 0,
          explanation: `L'opera "${title}" è stata realizzata da ${artist}.`,
          relatedArtworkTitle: title
        });
      } else {
        questions.push({
          question: `A quale corrente artistica o periodo appartiene l'opera "${title}"?`,
          options: [currents, 'Cubismo contemporaneo', 'Gotico internazionale', 'Astrattismo geometrico'],
          correctAnswerIndex: 0,
          explanation: `L'opera "${title}" si inserisce nel contesto di ${currents}.`,
          relatedArtworkTitle: title
        });
      }
    }

    return {
      title: `Quiz: ${visitContext?.title || 'Visita Guidata'}`,
      description: `Quiz finale di verifica per la visita ${visitContext?.title || 'del museo'}`,
      difficulty,
      targetAge,
      language,
      questions
    };
  }

  static _mockLogisticalDirections(currentLocation, targetLocation, museumContext) {
    const fromRoom = currentLocation?.room || 'Sala attuale';
    const fromFloor = currentLocation?.floor || 'Piano Terra';
    const toRoom = targetLocation?.room || targetLocation?.name || 'Destinazione';
    const toFloor = targetLocation?.floor || 'Piano Terra';

    if (fromFloor !== toFloor) {
      return `Dalla stanza "${fromRoom}" (${fromFloor}), dirigiti verso l'atrio principale e prendi l'ascensore o le scale per raggiungere il ${toFloor}. Troverai "${toRoom}" subito all'uscita del corridoio principale.`;
    }

    return `Dalla stanza "${fromRoom}", prosegui dritto lungo il corridoio della galleria. Troverai "${toRoom}" sul lato destro dopo l'ampia arcata.`;
  }

  static _mockAdaptedItem(artworkTitle, tone, lengthSeconds, language, existingText = '') {
    // const prefix = existingText ? `[AI Adaptation from Original Author Text]` : `[AI Storyteller]`;
    if (tone === 'infantile') {
      return `Ciao! Guarda che bella quest'opera intitolata "${artworkTitle}"! È stata creata con colori vivaci per raccontarci una storia fantastica su persone e luoghi speciali del passato. Riesci a vedere tutti i dettagli nascosti?`;
      // return `${prefix} Ciao! Guarda che bella quest'opera intitolata "${artworkTitle}"! È stata creata con colori vivaci per raccontarci una storia fantastica su persone e luoghi speciali del passato. Riesci a vedere tutti i dettagli nascosti?`;
    }
    if (tone === 'technical' || tone === 'scientific' || tone === 'expert') {
      return `L'opera "${artworkTitle}" costituisce una testimonianza emblematica dell'evoluzione stilistica del periodo. La composizione formale, l'uso del chiaroscuro e la gestione della prospettiva spaziale rivelano un'intellettualizzazione rigorosa dei codici visivi contemporanei.`;
      // return `${prefix} L'opera "${artworkTitle}" costituisce una testimonianza emblematica dell'evoluzione stilistica del periodo. La composizione formale, l'uso del chiaroscuro e la gestione della prospettiva spaziale rivelano un'intellettualizzazione rigorosa dei codici visivi contemporanei.`;
    }
    if (tone === 'simple') {
      return `Questa è l'opera "${artworkTitle}". È un dipinto molto interessante creato con uno stile semplice e chiaro per mostrare i momenti importanti della storia dell'artista.`;
      // return `${prefix} Questa è l'opera "${artworkTitle}". È un dipinto molto interessante creato con uno stile semplice e chiaro per mostrare i momenti importanti della storia dell'artista.`;
    }
    return `L'opera "${artworkTitle}" offre uno sguardo affascinante sulla sensibilità artistica dell'epoca. Attraverso una tecnica raffinata e una scelta cromatica ben bilanciata, l'autore guida lo sguardo del visitatore verso gli elementi simbolo della composizione.`;
    // return `${prefix} L'opera "${artworkTitle}" offre uno sguardo affascinante sulla sensibilità artistica dell'epoca. Attraverso una tecnica raffinata e una scelta cromatica ben bilanciata, l'autore guida lo sguardo del visitatore verso gli elementi simbolo della composizione.`;
  }

  /**
   * Restituisce il nome del provider AI attualmente attivo nel runtime
   */
  static getActiveProviderName() {
    if (process.env.GROQ_API_KEY) return `Groq Cloud AI (${process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'})`;
    if (process.env.GEMINI_API_KEY) return `Google Gemini AI (${process.env.GEMINI_MODEL || 'gemini-1.5-flash'})`;
    if (process.env.OPENAI_API_KEY) return `OpenAI (${process.env.OPENAI_MODEL || 'gpt-4o-mini'})`;
    if (process.env.OLLAMA_HOST) return `Ollama Local (${process.env.OLLAMA_MODEL || 'llama3'})`;
    return `Fallback Engine Mock Offline`;
  }

  /**
   * Helper generico per invocare API esterne (Groq, Gemini, OpenAI, Ollama)
   */
  static async _callLLMHandler(prompt) {
    if (process.env.GROQ_API_KEY && process.env.GROQ_MODEL) {
      console.log(`\x1b[36m[DEBUG AI] LLM API Groq Cloud (${process.env.GROQ_MODEL})\x1b[0m`);
      return this._callGroqAPI(prompt);
    }
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_MODEL) {
      console.log(`\x1b[36m[DEBUG AI] LLM API Google Gemini (${process.env.GEMINI_MODEL})\x1b[0m`);
      return this._callGeminiAPI(prompt);
    }
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL) {
      console.log(`\x1b[36m[DEBUG AI] LLM API OpenAI (${process.env.OPENAI_MODEL})\x1b[0m`);
      return this._callOpenAIAPI(prompt);
    }
    console.log(`\x1b[33m[DEBUG AI] Nessun LLM API Key e Model presenti nel .env\x1b[0m`);
    throw new Error('Nessun LLM configurato in .env.');
  }

  static _callGroqAPI(prompt) {
    return new Promise((resolve, reject) => {
      const apiKey = process.env.GROQ_API_KEY;
      const model = process.env.GROQ_MODEL;
      const postData = JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }]
      });

      const req = https.request({
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            const text = parsed.choices?.[0]?.message?.content;
            if (text) resolve(text);
            else reject(new Error(body));
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  static _callGeminiAPI(prompt) {
    return new Promise((resolve, reject) => {
      const apiKey = process.env.GEMINI_API_KEY;
      const model = process.env.GEMINI_MODEL;
      const postData = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      });

      const req = https.request({
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) resolve(text);
            else reject(new Error(body));
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  static _callOpenAIAPI(prompt) {
    return new Promise((resolve, reject) => {
      const apiKey = process.env.OPENAI_API_KEY;
      const model = process.env.OPENAI_MODEL;
      const postData = JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }]
      });

      const req = https.request({
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            const text = parsed.choices?.[0]?.message?.content;
            if (text) resolve(text);
            else reject(new Error(body));
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }
}

module.exports = LLMService;
