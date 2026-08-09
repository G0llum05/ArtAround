const GroqSTTService = require('../../service/GroqSTTService');
const NavigatorService = require('../../service/NavigatorService');
const ResponsiveVoiceService = require('../../service/ResponsiveVoiceService');
const NavigatorMapper = require('../../data/mapper/NavigatorMapper');

// TODO GLOBALE -> DTO di req e res per TUTTI i metodi


class NavigatorController {

  static async navigatorHandler(req, res) {
    /* #swagger.tags = ['Navigator']
       #swagger.summary = 'Gestisce le richieste del navigatore (trascrizione, comando, TTS)'
    */
    // header per streaming NDJSON (newline-delimited JSON) per avere la connessione persistente e inviare più chunk di risposta in tempo reale
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const requestDTO = NavigatorMapper.toNavigatorRequestDTO(req);

      const onTranscription = async (transcribedText) => {
        res.write(JSON.stringify({
          type: 'TRANSCRIPTION',
          success: true,
          text: transcribedText
        }) + '\n');
      };

      const result = await NavigatorService.navigatorHandler(...requestDTO, onTranscription);

      const responseDTO = NavigatorMapper.toNavigatorResponseDTO(result);

      res.write(JSON.stringify({
        type: 'FINAL_RESPONSE',
        success: true,
        data: responseDTO
      }) + '\n');

      res.end();
    } catch (err) {
      console.error('[NavigatorController Error]:', err);
      res.write(JSON.stringify({
        type: 'ERROR',
        success: false,
        error: err.message || 'Errore durante l\'elaborazione'
      }) + '\n');
      res.end();
    }
  }


  /* IMPORTANTE GUIDA
  *   ### 2. Configurazione del Client (Frontend Angular o Test Script)
  
    L'HttpClient standard di Angular attende il termine della risposta prima di emettere i dati. Per consumare uno stream HTTP
    in tempo reale, utilizzeremo la fetch nativa del browser con ReadableStream.
  
    #### A. Modifica al Service Angular navigator.service.ts
  
    Aggiungi un metodo per inviare l'audio e gestire le risposte in streaming tramite callback:
  
      // frontend/src/app/services/navigator.service.ts
      
      async sendAudioCommandStream(
        formData: FormData,
        onChunk: (chunk: { type: string; text?: string; data?: any; error?: string }) => void
      ): Promise<void> {
        const targetUrl = (typeof window !== 'undefined' && window.location.port === '4200')
          ? 'http://localhost:8000/api/navigator'
          : `${this.apiBaseUrl}`;
      
        const response = await fetch(targetUrl, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
      
        if (!response.body) throw new Error('ReadableStream non supportato dal server');
      
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
      
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
      
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Tiene l'eventuale linea incompleta nel buffer
      
          for (const line of lines) {
            if (line.trim()) {
              try {
                const parsedChunk = JSON.parse(line);
                onChunk(parsedChunk);
              } catch (e) {
                console.error('Errore parsing chunk JSON:', e);
              }
            }
          }
        }
      }
      
    #### B. Modifica al Componente Angular navigator.component.ts
  
    Nel metodo processRecordedAudio:
  
      // frontend/src/app/pages/navigator.component/navigator.component.ts
      
      private async processRecordedAudio(mimeType: string): void {
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        const formData = new FormData();
        const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm';
      
        formData.append('audio', audioBlob, `recording.${ext}`);
        formData.append('actionType', 'AUDIO_ACTION');
        formData.append('visitId', this.selectedVisitId);
        formData.append('currentArtworkIndex', this.currentArtworkIndex.toString());
        formData.append('tone', this.currentTone);
        formData.append('length', this.currentLength.toString());
        formData.append('language', this.selectedLang);
      
        this.isProcessing = true;
        this.statusMessage = '🎙️ Trascrizione audio in corso...';
      
        try {
          await this.navigatorService.sendAudioCommandStream(formData, (chunk) => {
            // RISPOSTA 1: Trascrizione pronta! Mostra subito cosa ha detto l'utente.
            if (chunk.type === 'TRANSCRIPTION') {
              this.chatMessages.push({
                id: Math.random().toString(36).substring(2, 9),
                sender: 'user',
                text: chunk.text || '',
                timestamp: new Date().toLocaleTimeString(),
                source: 'voice'
              });
              this.statusMessage = '🤖 Trascritto! Elaborazione risposta AI in corso...';
              this.scrollToBottom();
              this.cdr.detectChanges();
            }
            
            // RISPOSTA 2: Risposta finale elaborata dall'AI! Mostra il messaggio e avvia il TTS.
            else if (chunk.type === 'FINAL_RESPONSE') {
              this.isProcessing = false;
              const botReply = chunk.data?.reply || 'Comando completato.';
              
              this.chatMessages.push({
                id: Math.random().toString(36).substring(2, 9),
                sender: 'bot',
                text: botReply,
                timestamp: new Date().toLocaleTimeString()
              });
      
              this.scrollToBottom();
      
              if (this.autoSpeakTTS) {
                this.navigatorService.speakText(botReply, this.selectedLang);
              }
              this.statusMessage = '✅ Risposta completata!';
              this.cdr.detectChanges();
            }
      
            else if (chunk.type === 'ERROR') {
              this.isProcessing = false;
              this.errorMessage = chunk.error || 'Errore elaborazione';
              this.cdr.detectChanges();
            }
          });
        } catch (err: any) {
          this.isProcessing = false;
          this.errorMessage = 'Errore di connessione streaming: ' + err.message;
          this.cdr.detectChanges();
        }
      }
      ──────
    ### 3. Come testare l'endpoint da CLI/Node script (es. test-navigator-cli.js o curl)
  
    Per verificare lo streaming con curl:
  
      curl -N -X POST http://localhost:8000/api/navigator \
        -F "audio=@/path/to/test.webm" \
        -F "actionType=AUDIO_ACTION"
  
    Noterai che il terminale stamperà il primo JSON {"type":"TRANSCRIPTION", ...} immediatamente dopo pochi millisecondi e,
    successivamente, il secondo JSON {"type":"FINAL_RESPONSE", ...} al termine dell'elaborazione LLM.
  
    ### Riepilogo Vantaggi
  
    • Latenza percepita ridotta a zero: L'utente vede subito a schermo la propria frase trascritta, capendo che il microfono
    ha funzionato senza attendere i tempi di generazione dell'LLM.
    • Singolo caricamento del file audio: L'audio viene inviato una sola volta dal client al backend.
  */




  // /**
  //  * estrae lingua da cookie di sessione/header/body
  //  */
  // static _extractLanguage(req) {
  //   return (
  //     req.cookies?.lang ||
  //     req.cookies?.language ||
  //     req.headers['x-language'] ||
  //     req.body?.language ||
  //     req.query?.lang ||
  //     'it'
  //   );
  // }
  //
  // /**
  //  * Trascrive l'audio inviato dal client tramite Groq STT (Whisper API via groq-sdk)
  //  * POST /api/navigator/stt
  //  * POST /api/navigator/transcribe
  //  * POST /api/transcribe
  //  */
  // static async transcribeAudio(req, res) {
  //   /* #swagger.tags = ['Navigator']
  //      #swagger.summary = 'Trascrive un file audio via Groq STT (Whisper)'
  //      #swagger.consumes = ['multipart/form-data']
  //      #swagger.parameters['audio'] = {
  //         in: 'formData',
  //         type: 'file',
  //         required: true,
  //         description: 'File audio registrato (webm, ogg, mp4, wav)'
  //      }
  //   */
  //   try {
  //     if (!req.file && !req.files) {
  //       return res.status(400).json({ success: false, error: 'Nessun file audio inviato.' });
  //     }
  //
  //     const file = req.file || (req.files && req.files[0]);
  //     if (!file || !file.buffer || file.buffer.length === 0) {
  //       return res.status(400).json({ success: false, error: 'Il buffer del file audio è vuoto.' });
  //     }
  //
  //     // TODO La lingua viene estratta dai cookie o dagli header e non dal testo trascritto. Per il momento va bene così, in un secondo momento potremmo incrementare questa cosa
  //     const lang = NavigatorController._extractLanguage(req);
  //
  //     const sttResult = await GroqSTTService.transcribe(file.buffer, {
  //       filename: file.originalname || 'recording.webm',
  //       mimeType: file.mimetype || 'audio/webm',
  //       language: lang
  //     });
  //
  //     return res.json({
  //       success: true,
  //       text: sttResult.text,
  //       reply: sttResult.text,
  //       audioSizeBytes: sttResult.audioSizeBytes
  //     });
  //   } catch (err) {
  //     console.error('[NavigatorController STT Error]:', err);
  //     return res.status(500).json({
  //       success: false,
  //       error: err.message || 'Errore durante la trascrizione audio'
  //     });
  //   }
  // }
  //
  //
  //
  // /**
  //  * Processa un comando vocale o testuale completo per il navigatore della visita
  //  * POST /api/navigator/command
  //  */
  // // TODO -> fare DTO req e res
  // static async handleCommand(req, res) {
  //   /* #swagger.tags = ['Navigator']
  //      #swagger.summary = 'Elabora comando vocale/testuale del navigatore'
  //   */
  //   // TODO : HANDLER più strutturato
  //
  //   try {
  //     const lang = NavigatorController._extractLanguage(req);
  //
  //     // Se viene allegato un audio, trascrivi prima via Groq STT
  //     if (req.file) {
  //       const sttResult = await GroqSTTService.transcribe(req.file.buffer, {
  //         filename: req.file.originalname || 'recording.webm',
  //         mimeType: req.file.mimetype || 'audio/webm',
  //         language: lang
  //       });
  //       transcribedText = sttResult.text;
  //     }
  //
  //     // TODO : prima di dire che non c'è nessun testo/comando bisogna controllare i comandi manuali 
  //     if (!transcribedText) {
  //       return res.status(400).json({
  //         success: false,
  //         error: 'Nessun testo o audio decodificabile fornito.'
  //         // TODO: controllare come viene gestito caso di errore
  //       });
  //     }
  //
  //     // TODO: QUA, se c'è testo trascritto, intanto va mandato al front mentre l'elaborazione del comando viene fatta in parallelo
  //
  //     const visitId = req.body.visitId;
  //     const currentArtworkIndex = parseInt(req.body.currentArtworkIndex, 10);
  //     const currentTone = req.body.currentTone;
  //
  //     // TODO : attenzione perchè potrebbe non esserci testo trascritto ma potrebbe esserci il comando manuale
  //     let result = { transcribedText: transcribedText };
  //
  //     // ELABORAZIONE COMANDO      
  //
  //
  //     // Esegue sempre NavigatorService per elaborare l'intent e generare la risposta del Chatbot
  //     const navResult = await NavigatorService.handleUserCommand({
  //       inputText,
  //       visitId,
  //       currentArtworkIndex,
  //       currentTone,
  //       currentLanguage: lang
  //     });
  //     result = { ...result, ...navResult };
  //
  //     const reply = result.spokenResponse || result.narrativeText || (result.item ? result.item.description : null) || result.actionMessage || inputText;
  //
  //
  //     // TODO: QUA deve ritornare il testo trascritto come risposta e l'audio
  //     return res.json({
  //       success: true,
  //       text: inputText,
  //       reply,
  //       result
  //     });
  //   } catch (err) {
  //     console.error('[NavigatorController Command Error]:', err);
  //     return res.status(500).json({
  //       success: false,
  //       error: err.message || 'Errore elaborazione comando navigatore'
  //     });
  //   }
  // }

  /**
   * Genera e invia lo stream audio MP3 (TTS) dal backend Express.
   * GET /api/navigator/tts?text=...&lang=it
   * POST /api/navigator/tts
   */
  static async streamTTS(req, res) {
    /* #swagger.tags = ['Navigator']
       #swagger.summary = 'Sintesi vocale TTS Backend (MP3 Audio Stream)'
    */
    try {
      const text = req.query.text || req.body?.text;
      const lang = req.query.lang || req.body?.language || NavigatorController._extractLanguage(req);

      if (!text || !text.trim()) {
        return res.status(400).json({ success: false, error: 'Parametro text mancante.' });
      }

      // 1. Tenta sintesi sicura backend via ResponsiveVoiceService
      try {
        const audioBuffer = await ResponsiveVoiceService.synthesizeAudioBuffer(text, lang);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', audioBuffer.length);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(audioBuffer);
      } catch (rvErr) {
        console.warn('[NavigatorController] ResponsiveVoiceService TTS warning, fallback a Google TTS:', rvErr.message);
      }

      // // 2. Fallback a Google TTS service
      // let cleanLang = (lang || 'it').toLowerCase();
      // if (cleanLang.includes('en') || cleanLang.includes('us')) cleanLang = 'en';
      // else if (cleanLang.includes('fr') || cleanLang.includes('fra')) cleanLang = 'fr';
      // else if (cleanLang.includes('sp') || cleanLang.includes('es')) cleanLang = 'es';
      // else if (cleanLang.includes('de')) cleanLang = 'de';
      // else if (cleanLang.includes('cn') || cleanLang.includes('zh')) cleanLang = 'zh-CN';
      // else if (cleanLang.includes('ru') || cleanLang.includes('rus')) cleanLang = 'ru';
      // else cleanLang = 'it';
      //
      // const trimmedText = text.trim().substring(0, 300);
      //
      // const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(trimmedText)}&tl=${cleanLang}&client=tw-ob`;
      //
      // const response = await fetch(googleTtsUrl, {
      //   headers: {
      //     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      //   }
      // });

      // if (!response.ok) {
      //   throw new Error(`Google TTS Service Error: status ${response.status}`);
      // }

      // const audioArrayBuffer = await response.arrayBuffer();
      // const audioBuffer = Buffer.from(audioArrayBuffer);
      //
      // res.setHeader('Content-Type', 'audio/mpeg');
      // res.setHeader('Content-Length', audioBuffer.length);
      // res.setHeader('Cache-Control', 'public, max-age=86400');
      // return res.send(audioBuffer);
    } catch (err) {
      console.error('[NavigatorController TTS Error]:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Errore durante la generazione dell\'audio TTS'
      });
    }
  }
}

module.exports = NavigatorController;
