const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

let promptsConfig = null;
function getPrompt(key, replacements = {}) {
  if (!promptsConfig) {
    try {
      const configPath = path.join(__dirname, '../config/llm-prompts.json');
      if (fs.existsSync(configPath)) {
        promptsConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
    } catch (e) {
      console.warn('[LLMService] Impossibile caricare llm-prompts.json, utilizzo prompt di default.');
    }
  }
  let template = (promptsConfig && promptsConfig[key]) ? promptsConfig[key] : '';
  for (const [k, v] of Object.entries(replacements)) {
    const val = typeof v === 'object' ? JSON.stringify(v) : String(v || '');
    template = template.split(`{{${k}}}`).join(val);
  }
  return template;
}

/**
 * LLMService - Service modulare per l'integrazione con Generative AI (LLM).
 * 
 * Supporta:
 * 1. Provider reali (Groq / OpenAI / Google Gemini / Ollama) configurabili tramite process.env.
 * 2. Provider Mock Offline di fallback autonomo: per sviluppare e testare senza chiavi API o connessione.
 * 3. Prompt configurabili esternamente in backend/config/llm-prompts.json.
 */
class LLMService {

  /**
   * (1) PARSE COMMAND: Mappa frasi in linguaggio naturale sugli Intent del Vocabolario Controllato
   */
  static async parseNaturalLanguageCommand(inputText, context = {}) {
    const textLower = (inputText || '').toLowerCase().trim();

    // Provider Mock / Rule Engine intelligente di fallback
    if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      return this._mockParseCommand(textLower, context);
    }

    try {
      const prompt = getPrompt('parseCommand', { inputText, context });
      const responseText = await this._callLLM(prompt);
      const parsed = this._cleanAndParseJSON(responseText);
      if (parsed) {
        return parsed;
      }
    } catch (err) {
      console.warn('[LLMService] Chiamata LLM fallita, utilizzo fallback mock:', err.message);
    }

    return this._mockParseCommand(textLower, context);
  }

  /**
   * LOGISTICAL DIRECTIONS: Genera indicazioni di navigazione tra posizioni e luoghi del museo
   */
  static async generateLogisticalDirections(currentLocation, targetLocation, museumContext = {}) {
    if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      return this._mockLogisticalDirections(currentLocation, targetLocation, museumContext);
    }

    try {
      const prompt = getPrompt('logisticalDirections', { currentLocation, targetLocation, museumContext });
      return await this._callLLM(prompt);
    } catch (err) {
      console.warn('[LLMService] Chiamata LLM indicazioni fallita, utilizzo fallback mock:', err.message);
      return this._mockLogisticalDirections(currentLocation, targetLocation, museumContext);
    }
  }

  /**
   * ADAPTED ITEM: Genera un testo di spiegazione per un'opera rielaborando il contesto dell'opera ed eventuale testo base dell'autore
   */
  static async generateAdaptedItem(artworkContext, tone = 'medium', lengthSeconds = 30, language = 'it', existingText = '') {
    const title = typeof artworkContext === 'string' ? artworkContext : (artworkContext.title || 'Opera');

    if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      return this.extractToneText(this._mockAdaptedItem(title, tone, lengthSeconds, language, existingText), tone);
    }

    try {
      const prompt = getPrompt('generateAdaptedItem', {
        artworkContext: typeof artworkContext === 'object' ? artworkContext : { title },
        existingText: existingText || 'Nessun testo precedente disponibile.',
        tone,
        lengthSeconds,
        language
      });

      const responseText = await this._callLLM(prompt);
      return this.extractToneText(responseText, tone);
    } catch (err) {
      console.warn('[LLMService] Chiamata LLM adattamento item fallita, utilizzo fallback mock:', err.message);
      return this.extractToneText(this._mockAdaptedItem(title, tone, lengthSeconds, language, existingText), tone);
    }
  }

  /**
   * Helper per isolare esclusivamente il paragrafo del tono richiesto
   * qualora l'LLM o la cache memorizzino intestazioni multi-tono (es. **Simple**, **Infantile**)
   */
  static extractToneText(fullText, requestedTone = 'medium') {
    if (!fullText || typeof fullText !== 'string') return fullText;

    const toneLower = (requestedTone || 'medium').toLowerCase();
    
    // Se il testo contiene marcatori come **Infantile** o **Simple** o ### Medium
    if (fullText.includes('**') || fullText.includes('###') || fullText.toLowerCase().includes('infantile')) {
      const sections = fullText.split(/(?=\*\*|\#\#\#)/);
      for (const sec of sections) {
        const firstLineLower = sec.split('\n')[0].toLowerCase();
        if (firstLineLower.includes(toneLower)) {
          // Rimuove l'intestazione markdown ed i ritorni a capo iniziali
          return sec.replace(/^(\*\*|###).+?(\*\*|\n)/, '').trim();
        }
      }
    }

    return fullText.trim();
  }


  /**
   * SMART VISIT: Compone una visita personalizzata basata sui vincoli dell'utente
   */
  static async generateSmartVisit(constraints, availableArtworks = []) {
    const titles = availableArtworks.map(a => a.title);
    if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      return {
        suggestedArtworks: availableArtworks.slice(0, 3).map(a => a._id),
        rationale: `Visita veloce selezionata in base al tempo disponibile (${constraints.availableTimeMinutes || 30} min).`
      };
    }

    try {
      const prompt = getPrompt('smartVisit', { titles, constraints });
      const responseText = await this._callLLM(prompt);
      const parsed = this._cleanAndParseJSON(responseText);
      if (parsed) {
        const selectedIds = availableArtworks
          .filter(a => (parsed.selectedTitles || []).includes(a.title))
          .map(a => a._id);
        return {
          suggestedArtworks: selectedIds.length > 0 ? selectedIds : availableArtworks.slice(0, 3).map(a => a._id),
          rationale: parsed.rationale || 'Percorso ottimizzato in base ai vincoli stabiliti.'
        };
      }
    } catch (err) {
      console.warn('[LLMService] Chiamata Smart Visit fallita, utilizzo fallback mock:', err.message);
    }

    return {
      suggestedArtworks: availableArtworks.slice(0, 3).map(a => a._id),
      rationale: 'Visita guidata generata in base alle opere principali ed al tempo stimato.'
    };
  }

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

  static _mockParseCommand(textLower, context) {
    if (textLower.includes('inglese') || textLower.includes('english') || textLower.includes('englesh')) {
      return { intent: 'CHANGE_LANGUAGE', requestedLanguage: 'en', confidence: 0.98 };
    }
    if (textLower.includes('francese') || textLower.includes('french') || textLower.includes('français')) {
      return { intent: 'CHANGE_LANGUAGE', requestedLanguage: 'fr', confidence: 0.98 };
    }
    if (textLower.includes('spagnolo') || textLower.includes('spanish') || textLower.includes('español')) {
      return { intent: 'CHANGE_LANGUAGE', requestedLanguage: 'es', confidence: 0.98 };
    }
    if (textLower.includes('italiano') || textLower.includes('italian')) {
      return { intent: 'CHANGE_LANGUAGE', requestedLanguage: 'it', confidence: 0.98 };
    }
    if (textLower.includes('accorcia') || textLower.includes('riduci') || textLower.includes('tempi') || textLower.includes('veloce') || textLower.includes('fretta') || textLower.includes('sintetico')) {
      return { intent: 'SHORTEN_LENGTH', requestedLength: 15, confidence: 0.98 };
    }
    if (textLower.includes('allunga') || textLower.includes('più lunga') || textLower.includes('estendi')) {
      return { intent: 'EXTEND_LENGTH', requestedLength: 60, confidence: 0.98 };
    }
    if (textLower.includes('bambin') || textLower.includes('semplic') || textLower.includes('non capisc') || textLower.includes('più facile') || textLower.includes('meno diffic')) {
      return { intent: 'SIMPLIFY_TONE', requestedTone: 'simple', confidence: 0.98 };
    }
    if (textLower.includes('dettagli') || textLower.includes('approfond') || textLower.includes('tecnic') || textLower.includes('esperti') || textLower.includes('scientific') || textLower.includes('studioso') || textLower.includes('diffic')) {
      return { intent: 'ADVANCE_TONE', requestedTone: 'advanced', confidence: 0.95 };
    }
    if (textLower.includes('prossim') || textLower.includes('avanti') || textLower.includes('dopo') || textLower.includes('successiv')) {
      return { intent: 'NEXT_ITEM', confidence: 0.99 };
    }
    if (textLower.includes('indietro') || textLower.includes('prima') || textLower.includes('precedent')) {
      return { intent: 'PREVIOUS_ITEM', confidence: 0.99 };
    }
    // POI Parsing completo
    if (textLower.includes('bagno disabil') || textLower.includes('toilette disabil')) {
      return { intent: 'NAVIGATE_POI', targetPoiType: 'disabled_toilette', confidence: 0.97 };
    }
    if (textLower.includes('bagno') || textLower.includes('toilette') || textLower.includes('wc')) {
      return { intent: 'NAVIGATE_POI', targetPoiType: 'toilette', confidence: 0.96 };
    }
    if (textLower.includes('bar') || textLower.includes('caffè')) {
      return { intent: 'NAVIGATE_POI', targetPoiType: 'bar', confidence: 0.96 };
    }
    if (textLower.includes('ristorante') || textLower.includes('pranzo') || textLower.includes('mangiare')) {
      return { intent: 'NAVIGATE_POI', targetPoiType: 'restaurant', confidence: 0.96 };
    }
    if (textLower.includes('shop') || textLower.includes('negozio') || textLower.includes('bookshop') || textLower.includes('souvenir')) {
      return { intent: 'NAVIGATE_POI', targetPoiType: 'shop', confidence: 0.96 };
    }
    if (textLower.includes('uscita di emergenza') || textLower.includes('antincendio')) {
      return { intent: 'NAVIGATE_POI', targetPoiType: 'emergency_exit', confidence: 0.98 };
    }
    if (textLower.includes('uscita') || textLower.includes('uscire') || textLower.includes('fuori')) {
      return { intent: 'NAVIGATE_POI', targetPoiType: 'exit', confidence: 0.97 };
    }
    if (textLower.includes('ingresso') || textLower.includes('entrata')) {
      return { intent: 'NAVIGATE_POI', targetPoiType: 'entrance', confidence: 0.97 };
    }
    if (textLower.includes('ascensore')) {
      return { intent: 'NAVIGATE_POI', targetPoiType: 'elevator', confidence: 0.96 };
    }
    if (textLower.includes('scale')) {
      return { intent: 'NAVIGATE_POI', targetPoiType: 'stairs', confidence: 0.96 };
    }
    if (textLower.includes('bigliett') || textLower.includes('cassa')) {
      return { intent: 'NAVIGATE_POI', targetPoiType: 'ticket_office', confidence: 0.96 };
    }
    if (textLower.includes('info') || textLower.includes('informazion')) {
      return { intent: 'NAVIGATE_POI', targetPoiType: 'info_point', confidence: 0.96 };
    }
    if (textLower.includes('guardaroba') || textLower.includes('zaini') || textLower.includes('giacche')) {
      return { intent: 'NAVIGATE_POI', targetPoiType: 'cloakroom', confidence: 0.96 };
    }
    if (textLower.includes('pronto soccorso') || textLower.includes('infermeria') || textLower.includes('medico')) {
      return { intent: 'NAVIGATE_POI', targetPoiType: 'first_aid', confidence: 0.96 };
    }
    if (textLower.includes('autore') || textLower.includes('chi ha dipinto') || textLower.includes('chi l\'ha fatto') || textLower.includes('artista')) {
      return { intent: 'ASK_AUTHOR_INFO', confidence: 0.92 };
    }

    return { intent: 'UNKNOWN', confidence: 0.40 };
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
    const prefix = existingText ? `[AI Adaptation from Original Author Text]` : `[AI Storyteller]`;
    if (tone === 'infantile') {
      return `${prefix} Ciao! Guarda che bella quest'opera intitolata "${artworkTitle}"! È stata creata con colori vivaci per raccontarci una storia fantastica su persone e luoghi speciali del passato. Riesci a vedere tutti i dettagli nascosti?`;
    }
    if (tone === 'advanced' || tone === 'technical' || tone === 'scientific' || tone === 'expert') {
      return `${prefix} L'opera "${artworkTitle}" costituisce una testimonianza emblematica dell'evoluzione stilistica del periodo. La composizione formale, l'uso del chiaroscuro e la gestione della prospettiva spaziale rivelano un'intellettualizzazione rigorosa dei codici visivi contemporanei.`;
    }
    if (tone === 'simple') {
      return `${prefix} Questa è l'opera "${artworkTitle}". È un dipinto molto interessante creato con uno stile semplice e chiaro per mostrare i momenti importanti della storia dell'artista.`;
    }
    return `${prefix} L'opera "${artworkTitle}" offre uno sguardo affascinante sulla sensibilità artistica dell'epoca. Attraverso una tecnica raffinata e una scelta cromatica ben bilanciata, l'autore guida lo sguardo del visitatore verso gli elementi simbolo della composizione.`;
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
  static async _callLLM(prompt) {
    if (process.env.GROQ_API_KEY) {
      console.log(`\x1b[36m[DEBUG AI] 🚀 Invoco API Reale: Groq Cloud (${process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'})...\x1b[0m`);
      return this._callGroqAPI(prompt);
    }
    if (process.env.GEMINI_API_KEY) {
      console.log(`\x1b[36m[DEBUG AI] 🚀 Invoco API Reale: Google Gemini (${process.env.GEMINI_MODEL || 'gemini-1.5-flash'})...\x1b[0m`);
      return this._callGeminiAPI(prompt);
    }
    if (process.env.OPENAI_API_KEY) {
      console.log(`\x1b[36m[DEBUG AI] 🚀 Invoco API Reale: OpenAI (${process.env.OPENAI_MODEL || 'gpt-4o-mini'})...\x1b[0m`);
      return this._callOpenAIAPI(prompt);
    }
    if (process.env.OLLAMA_HOST) {
      console.log(`\x1b[36m[DEBUG AI] 🚀 Invoco LLM Locale: Ollama (${process.env.OLLAMA_MODEL || 'llama3'})...\x1b[0m`);
      return this._callOllamaAPI(prompt);
    }
    console.log(`\x1b[33m[DEBUG AI] ⚡ Nessuna API Key presente in process.env -> Utilizzo Fallback Engine Mock Offline\x1b[0m`);
    throw new Error('Nessuna chiave API o host LLM configurato in process.env.');
  }

  static _callGroqAPI(prompt) {
    return new Promise((resolve, reject) => {
      const apiKey = process.env.GROQ_API_KEY;
      const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
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
      const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
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
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
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

  static _callOllamaAPI(prompt) {
    return new Promise((resolve, reject) => {
      const host = process.env.OLLAMA_HOST || 'localhost';
      const port = process.env.OLLAMA_PORT || 11434;
      const model = process.env.OLLAMA_MODEL || 'llama3';
      const postData = JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false
      });

      const req = http.request({
        hostname: host,
        port: port,
        path: '/api/generate',
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
            if (parsed.response) resolve(parsed.response);
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
