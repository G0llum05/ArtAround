const http = require('http');
const https = require('https');


// TODO: TUTTI i promt e i comandi da mandare all'llm vanno resi più modificabili. Quindi prob è comodo avere un file di configurazione JSON o YAML con i prompt e le istruzioni per ogni comando, così da poterli modificare senza toccare il codice.

/**
 * LLMService - Service modulare per l'integrazione con Generative AI (LLM).
 * 
 * Supporta:
 * 1. Provider reali (OpenAI / Google Gemini / Ollama) configurabili tramite process.env.
 * 2. Provider Mock Offline di fallback autonomo: per sviluppare e testare senza chiavi API o connessione.
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

    // Se la API Key è presente nel process.env, esegue la chiamata al modello
    try {
      const prompt = `Sei l'engine NLP di una guida per musei. Analizza la seguente frase del visitatore e mappa l'intent in un JSON puro.
Frase utente: "${inputText}"
Context attuale: ${JSON.stringify(context)}

Rispondi ESCLUSIVAMENTE con un JSON con la seguente struttura:
{
  "intent": "SIMPLIFY_TONE" | "ADVANCE_TONE" | "NEXT_ITEM" | "PREVIOUS_ITEM" | "ASK_AUTHOR_INFO" | "NAVIGATE_POI" | "UNKNOWN",
  "targetPoiType": "toilette" | "bar" | "exit" | "elevator" | "shop" | null,
  "requestedTone": "infantile" | "simple" | "medium" | "advanced" | null,
  "confidence": 0.95
}`;
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
      const prompt = `Sei la guida vocale di un museo. L'utente si trova in: ${JSON.stringify(currentLocation)}.
La destinazione è: ${JSON.stringify(targetLocation)}.
Servizi e Piani del Museo: ${JSON.stringify(museumContext)}.

Fornisci un'indicazione logistica breve (2-3 frasi), chiara e naturale su come raggiungere la destinazione a piedi.`;
      
      return await this._callLLM(prompt);
    } catch (err) {
      console.warn('[LLMService] Chiamata LLM indicazioni fallita, utilizzo fallback mock:', err.message);
      return this._mockLogisticalDirections(currentLocation, targetLocation, museumContext);
    }
  }

  /**
   * ADAPTED ITEM: Genera un testo di spiegazione per un'opera con tono, durata o lingua specifica
   */
  static async generateAdaptedItem(artworkTitle, tone = 'medium', lengthSeconds = 30, language = 'it') {
    if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      return this._mockAdaptedItem(artworkTitle, tone, lengthSeconds, language);
    }

    try {
      const prompt = `Sei un curatore di musei ed esperto di comunicazione d'arte.
Scrivi una spiegazione per l'opera: "${artworkTitle}".
- Tono richiesto: ${tone} (infantile = per bambini 5-8 anni; simple = linguaggio chiaro e accessibile; medium = divulgativo bilanciato; advanced = accademico e dettagliato).
- Durata massima di lettura: ${lengthSeconds} secondi.
- Lingua: ${language}.

REQUISITO TASSATIVO: Restituisci ESCLUSIVAMENTE il singolo paragrafo di testo relativo al tono "${tone}". NON inserire elenchi, intestazioni markdown o opzioni per gli altri toni (es. NON scrivere **Infantile**, **Simple**, **Medium**, **Advanced**). Rispondi unicamente con il testo puro del tono richiesto.`;

      return await this._callLLM(prompt);
    } catch (err) {
      console.warn('[LLMService] Chiamata LLM adattamento item fallita, utilizzo fallback mock:', err.message);
      return this._mockAdaptedItem(artworkTitle, tone, lengthSeconds, language);
    }
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
      const prompt = `Sei un curatore museale. Seleziona le opere migliori da questo elenco: ${JSON.stringify(titles)} 
in base a questi vincoli utente: ${JSON.stringify(constraints)}.
Rispondi con un JSON: { "selectedTitles": [...], "rationale": "spiegazione breve" }`;

      const responseText = await this._callLLM(prompt);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
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

  // =========================================================================
  // IMPLEMENTAZIONE FALLBACK MOCK OFFLINE
  // =========================================================================

  static _mockParseCommand(textLower, context) {
    if (textLower.includes('bambin') || textLower.includes('semplic') || textLower.includes('non capisc') || textLower.includes('troppo diffic')) {
      return { intent: 'SIMPLIFY_TONE', requestedTone: 'infantile', confidence: 0.98 };
    }
    if (textLower.includes('dettagli') || textLower.includes('approfond') || textLower.includes('tecnic') || textLower.includes('esperti')) {
      return { intent: 'ADVANCE_TONE', requestedTone: 'advanced', confidence: 0.95 };
    }
    if (textLower.includes('prossim') || textLower.includes('avanti') || textLower.includes('dopo') || textLower.includes('successiv')) {
      return { intent: 'NEXT_ITEM', confidence: 0.99 };
    }
    if (textLower.includes('indietro') || textLower.includes('prima') || textLower.includes('precedent')) {
      return { intent: 'PREVIOUS_ITEM', confidence: 0.99 };
    }
    if (textLower.includes('bagno') || textLower.includes('toilette') || textLower.includes('wc')) {
      return { intent: 'NAVIGATE_POI', targetPoiType: 'toilette', confidence: 0.96 };
    }
    if (textLower.includes('bar') || textLower.includes('caffè') || textLower.includes('mangiare') || textLower.includes('ristorante')) {
      return { intent: 'NAVIGATE_POI', targetPoiType: 'bar', confidence: 0.96 };
    }
    if (textLower.includes('uscita') || textLower.includes('uscire') || textLower.includes('fuori')) {
      return { intent: 'NAVIGATE_POI', targetPoiType: 'exit', confidence: 0.97 };
    }
    if (textLower.includes('ascensore') || textLower.includes('scale')) {
      return { intent: 'NAVIGATE_POI', targetPoiType: 'elevator', confidence: 0.95 };
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

  static _mockAdaptedItem(artworkTitle, tone, lengthSeconds, language) {
    if (tone === 'infantile') {
      return `[AI Storyteller] Ciao! Guarda che bella quest'opera intitolata "${artworkTitle}"! È stata creata con colori vivaci per raccontarci una storia fantastica su persone e luoghi speciali del passato. Riesci a vedere tutti i dettagli nascosti?`;
    }
    if (tone === 'advanced') {
      return `[AI Academic Expert] L'opera "${artworkTitle}" costituisce una testimonianza emblematica dell'evoluzione stilistica del periodo. La composizione formale, l'uso del chiaroscuro e la gestione della prospettiva spaziale rivelano un'intellettualizzazione rigorosa dei codici visivi contemporanei.`;
    }
    return `[AI Standard Guide] L'opera "${artworkTitle}" offre uno sguardo affascinante sulla sensibilità artistica dell'epoca. Attraverso una tecnica raffinata e una scelta cromatica ben bilanciata, l'autore guida lo sguardo del visitatore verso gli elementi simbolo della composizione.`;
  }

  /**
   * Helper generico per invocare API esterne (Groq, Gemini, OpenAI, Ollama)
   */
  static async _callLLM(prompt) {
    if (process.env.GROQ_API_KEY) {
      return this._callGroqAPI(prompt);
    }
    if (process.env.GEMINI_API_KEY) {
      return this._callGeminiAPI(prompt);
    }
    if (process.env.OPENAI_API_KEY) {
      return this._callOpenAIAPI(prompt);
    }
    if (process.env.OLLAMA_HOST) {
      return this._callOllamaAPI(prompt);
    }
    throw new Error('Nessuna chiave API o host LLM configurato in process.env. Fallback su provider mock.');
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
