import { Component, OnDestroy, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { NavigatorClientService, CommandResponse, STTResponse } from '../../services/navigator.service';

export interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  source?: 'voice' | 'text';
  intent?: string;
  activeArtwork?: any;
  logisticalDirections?: string;
  isSpeaking?: boolean;
}

export interface ProcessLog {
  id: string;
  timestamp: string;
  transcript: string;
  recDurationMs: number;
  sttProcessMs: number;
  totalBackendMs: number;
  totalRoundtripMs: number;
  ttsStatus: string;
  audioSizeKb: string;
  lang: string;
  status: 'success' | 'error' | 'pending';
}

@Component({
  selector: 'app-navigator-test',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './navigator.component.html',
  styleUrl: './navigator.component.css'
})
export class NavigatorComponent implements OnInit, OnDestroy {
  @ViewChild('chatScrollContainer') private chatScrollContainer?: ElementRef;

  // State flags
  isRecording = false;
  isProcessing = false;
  isSpeaking = false;
  errorMessage: string | null = null;
  statusMessage = 'Pronto per l\'ascolto vocale o la selezione dei comandi.';

  // Audio & Recording properties
  private mediaRecorder: MediaRecorder | null = null;
  private currentStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private recStartTime = 0;
  public recDurationMs = 0;
  private recTimerInterval: any = null;
  public audioUrl: string | null = null;

  // State & Real Visit Integration
  public chatMessages: ChatMessage[] = [];
  public selectedVisitId = '';
  public visitsList: any[] = [];
  public currentVisitDetails: any = null;
  public visitArtworks: any[] = [];
  public currentArtworkIndex = 0;
  public currentTone = 'medium';
  public currentLength = 30;

  // Interactive Form Options
  public toneOptions = [
    { code: 'infantile', label: '👶 Per bambini' },
    { code: 'simple', label: '🌱 Semplice' },
    { code: 'medium', label: '📖 Divulgativo' },
    { code: 'advanced', label: '🎓 Avanzato' },
    { code: 'technical', label: '🔬 Tecnico' }
  ];

  public lengthOptions = [
    { value: 15, label: '⚡ Breve (~15 sec)' },
    { value: 30, label: '📖 Standard (~30 sec)' },
    { value: 60, label: '📜 Dettagliata (~60 sec)' }
  ];

  public poiCategories = [
    { label: '🚻 Toilette / Bagno', command: 'Dove si trova il bagno?' },
    { label: '☕ Bar & Ristoro', command: 'Dove si trova il bar?' },
    { label: '🚪 Uscita', command: 'Dove si trova l\'uscita?' },
    { label: '🛗 Ascensore', command: 'Dove si trova l\'ascensore?' },
    { label: '🎟️ Biglietteria', command: 'Dove si trova la biglietteria?' },
    { label: 'ℹ️ Info Point', command: 'Dove si trova l\'info point?' }
  ];

  // Latency Logs & Metrics
  public latestTranscript = '';
  public lastLog: ProcessLog | null = null;
  public logs: ProcessLog[] = [];

  // Language Selection
  public selectedLang = 'it';
  public languages: LanguageOption[] = [
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'en/us', name: 'English', flag: '🇺🇸' },
    { code: 'fra', name: 'Français', flag: '🇫🇷' },
    { code: 'sp', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'cn', name: '中文', flag: '🇨🇳' }
  ];

  // Options
  public autoSpeakTTS = true;
  public availableVoices: SpeechSynthesisVoice[] = [];

  constructor(
    private navigatorService: NavigatorClientService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setLanguage(this.selectedLang);
    this.loadVoices();
    this.loadVisits();

    // Ascolta eventuali parametri URL (es. /navigator?visitId=xxx)
    this.route.queryParams.subscribe(params => {
      if (params['visitId']) {
        this.onVisitChange(params['visitId']);
      }
    });

    // Messaggio iniziale di benvenuto
    this.chatMessages.push({
      id: 'welcome',
      sender: 'bot',
      text: '👋 Benvenuto nella Guida Museale. Scegli un\'azione dai moduli sottostanti oppure usa il microfono per parlare direttamente con l\'assistente.',
      timestamp: new Date().toLocaleTimeString()
    });

    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  ngOnDestroy(): void {
    this.stopRecordingTimer();
    this.stopMicrophoneStream();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  setLanguage(langCode: string): void {
    this.selectedLang = langCode;
    document.cookie = `lang=${langCode}; path=/; max-age=86400`;
  }

  loadVoices(): void {
    if ('speechSynthesis' in window) {
      this.availableVoices = window.speechSynthesis.getVoices();
    }
  }

  loadVisits(): void {
    this.navigatorService.getVisits().subscribe({
      next: (data: any) => {
        let rawList: any[] = [];
        if (Array.isArray(data)) {
          rawList = data;
        } else if (data && Array.isArray(data.visits)) {
          rawList = data.visits;
        } else if (data && data.data && Array.isArray(data.data)) {
          rawList = data.data;
        }

        this.visitsList = rawList.map(v => ({
          _id: v.id || v._id,
          title: v.title || v.name || ('Visita #' + (v.id || v._id))
        })).filter(v => !!v._id);

        if (!this.selectedVisitId && this.visitsList.length > 0) {
          const firstVisitId = this.visitsList[0]._id;
          this.onVisitChange(firstVisitId);
        } else if (this.selectedVisitId && !this.currentVisitDetails) {
          this.onVisitChange(this.selectedVisitId);
        }
      },
      error: (err) => {
        console.warn('Visite non caricate da /api/visits:', err);
      }
    });
  }

  onVisitChange(visitId: string): void {
    this.selectedVisitId = visitId;
    this.currentArtworkIndex = 0;
    this.currentVisitDetails = null;
    this.visitArtworks = [];

    if (!visitId) return;

    this.navigatorService.getVisitDetails(visitId).subscribe({
      next: (res: any) => {
        if (res) {
          this.currentVisitDetails = res;
          this.visitArtworks = res.artworks || [];
          const visitTitle = res.title || 'Visita Museale';
          const artworksCount = this.visitArtworks.length;
          
          this.chatMessages.push({
            id: Math.random().toString(36).substring(2, 9),
            sender: 'bot',
            text: `🗺️ Visita "${visitTitle}" caricata! Ci sono ${artworksCount} opere nel percorso. Seleziona un'opera per ascoltare la spiegazione o usa i comandi vocali.`,
            timestamp: new Date().toLocaleTimeString()
          });
          this.scrollToBottom();
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        console.warn('Impossibile caricare i dettagli della visita reale:', err);
      }
    });
  }

  onArtworkSelect(): void {
    this.navigateArtwork('explain');
  }

  async toggleRecording(): Promise<void> {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording(): Promise<void> {
    this.errorMessage = null;
    this.audioChunks = [];
    this.audioUrl = null;
    this.latestTranscript = '';

    try {
      // Requisito: microfono catturato a 16 kHz Mono (sampleRate: 16000, channelCount: 1)
      this.currentStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      // Selezione formato con preferenza per audio/webm;codecs=opus (compressione ultra-leggera 15-25KB)
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        } else {
          mimeType = '';
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      this.mediaRecorder = new MediaRecorder(this.currentStream, options);

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        // Garantisce la pulizia immediata delle tracce per prevenire memory leak nel browser
        this.stopMicrophoneStream();
        this.processRecordedAudio(mimeType || 'audio/webm');
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.recStartTime = performance.now();
      this.statusMessage = '🎙️ Registrazione in corso... Parla ora!';

      this.recTimerInterval = setInterval(() => {
        this.recDurationMs = Math.round(performance.now() - this.recStartTime);
        this.cdr.detectChanges();
      }, 100);

    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      this.stopMicrophoneStream();
      this.errorMessage = 'Impossibile accedere al microfono: ' + (err.message || err);
      this.statusMessage = 'Errore accesso microfono.';
      this.cdr.detectChanges();
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.stopRecordingTimer();
      this.statusMessage = '⏳ Elaborazione vocale (STT -> Navigator AI -> TTS)...';
      this.cdr.detectChanges();
    }
  }

  private stopMicrophoneStream(): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Track stop error:', e);
        }
      });
      this.currentStream = null;
    }
  }

  private stopRecordingTimer(): void {
    if (this.recTimerInterval) {
      clearInterval(this.recTimerInterval);
      this.recTimerInterval = null;
    }
  }

  private processRecordedAudio(mimeType: string): void {
    const audioBlob = new Blob(this.audioChunks, { type: mimeType });
    this.audioUrl = URL.createObjectURL(audioBlob);
    const audioSizeKb = (audioBlob.size / 1024).toFixed(1);

    const overallStart = performance.now();
    this.isProcessing = true;

    this.navigatorService.sendNavigatorCommand({
      audioBlob,
      visitId: this.selectedVisitId,
      currentArtworkIndex: this.currentArtworkIndex,
      currentTone: this.currentTone,
      lang: this.selectedLang
    }).subscribe({
      next: async (res: CommandResponse) => {
        const totalRoundtripMs = Math.round(performance.now() - overallStart);
        this.isProcessing = false;

        if (res && res.success) {
          this.latestTranscript = res.text || '(Vocale non decodificato)';
          
          // Aggiungi il messaggio dell'utente alla chat
          this.chatMessages.push({
            id: Math.random().toString(36).substring(2, 9),
            sender: 'user',
            text: this.latestTranscript,
            timestamp: new Date().toLocaleTimeString(),
            source: 'voice'
          });

          const replyText = res.reply || 'Comando elaborato.';
          
          // Aggiorna lo stato del Navigatore
          if (res.result) {
            if (res.result.currentArtworkIndex !== undefined) this.currentArtworkIndex = res.result.currentArtworkIndex;
            if (res.result.activeTone) this.currentTone = res.result.activeTone;
            if (res.result.activeLanguage) this.selectedLang = res.result.activeLanguage;
          }

          // Aggiungi la risposta del Bot alla chat
          const botMessage: ChatMessage = {
            id: Math.random().toString(36).substring(2, 9),
            sender: 'bot',
            text: replyText,
            timestamp: new Date().toLocaleTimeString(),
            intent: res.result?.nlpResult?.intent,
            activeArtwork: res.result?.activeArtwork,
            logisticalDirections: res.result?.logisticalDirections
          };
          this.chatMessages.push(botMessage);
          this.scrollToBottom();

          this.statusMessage = `✅ Risposta Chatbot: "${replyText.substring(0, 45)}..."`;

          // Sintesi Vocale TTS
          let ttsStatus = 'Disattivato';
          if (this.autoSpeakTTS && replyText) {
            botMessage.isSpeaking = true;
            this.isSpeaking = true;
            this.cdr.detectChanges();

            await this.navigatorService.speakText(replyText, this.selectedLang);
            botMessage.isSpeaking = false;
            this.isSpeaking = false;
            ttsStatus = 'Riprodotto con successo';
            this.statusMessage = '🏁 Pipeline Chatbot STT -> Navigator AI -> TTS completata!';
          }

          const logItem: ProcessLog = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            transcript: this.latestTranscript,
            recDurationMs: this.recDurationMs,
            sttProcessMs: res.sttProcessMs || 0,
            totalBackendMs: res.totalBackendMs || 0,
            totalRoundtripMs,
            ttsStatus,
            audioSizeKb: `${audioSizeKb} KB`,
            lang: this.selectedLang,
            status: 'success'
          };

          this.lastLog = logItem;
          this.logs.unshift(logItem);
        } else {
          this.errorMessage = res.error || 'Errore durante l\'elaborazione del comando.';
          this.statusMessage = 'Errore elaborazione comando.';
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isProcessing = false;
        console.error('Command Request Error:', err);
        this.errorMessage = 'Errore di connessione al backend: ' + (err.message || 'Server error');
        this.statusMessage = 'Errore durante l\'invio al backend.';
        this.cdr.detectChanges();
      }
    });
  }

  sendFormCommand(commandText: string, userDisplayLabel?: string): void {
    if (!commandText || !commandText.trim() || this.isProcessing) return;

    const textToSend = commandText.trim();
    const displayText = userDisplayLabel || textToSend;
    this.errorMessage = null;

    // Aggiungi l'azione dell'utente in chat
    this.chatMessages.push({
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text: displayText,
      timestamp: new Date().toLocaleTimeString(),
      source: 'text'
    });
    this.scrollToBottom();

    const overallStart = performance.now();
    this.isProcessing = true;
    this.statusMessage = '⏳ Elaborazione richiesta in corso...';

    this.navigatorService.sendNavigatorCommand({
      inputText: textToSend,
      visitId: this.selectedVisitId,
      currentArtworkIndex: this.currentArtworkIndex,
      currentTone: this.currentTone,
      lang: this.selectedLang
    }).subscribe({
      next: async (res: CommandResponse) => {
        const totalRoundtripMs = Math.round(performance.now() - overallStart);
        this.isProcessing = false;

        if (res && res.success) {
          const replyText = res.reply || 'Richiesta completata.';

          if (res.result) {
            if (res.result.currentArtworkIndex !== undefined) this.currentArtworkIndex = res.result.currentArtworkIndex;
            if (res.result.activeTone) this.currentTone = res.result.activeTone;
            if (res.result.activeLanguage) this.selectedLang = res.result.activeLanguage;
          }

          const botMessage: ChatMessage = {
            id: Math.random().toString(36).substring(2, 9),
            sender: 'bot',
            text: replyText,
            timestamp: new Date().toLocaleTimeString(),
            intent: res.result?.nlpResult?.intent,
            activeArtwork: res.result?.activeArtwork,
            logisticalDirections: res.result?.logisticalDirections
          };
          this.chatMessages.push(botMessage);
          this.scrollToBottom();

          this.statusMessage = `✅ Risposta della Guida ricevuta`;

          let ttsStatus = 'Disattivato';
          if (this.autoSpeakTTS && replyText) {
            botMessage.isSpeaking = true;
            this.isSpeaking = true;
            this.cdr.detectChanges();

            await this.navigatorService.speakText(replyText, this.selectedLang);
            botMessage.isSpeaking = false;
            this.isSpeaking = false;
            ttsStatus = 'Riprodotto con successo';
          }

          const logItem: ProcessLog = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            transcript: displayText,
            recDurationMs: 0,
            sttProcessMs: 0,
            totalBackendMs: res.totalBackendMs || 0,
            totalRoundtripMs,
            ttsStatus,
            audioSizeKb: '0 KB',
            lang: this.selectedLang,
            status: 'success'
          };
          this.lastLog = logItem;
          this.logs.unshift(logItem);
        } else {
          this.errorMessage = res.error || 'Errore durante l\'elaborazione della richiesta.';
          this.statusMessage = 'Errore risposta guida.';
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isProcessing = false;
        console.error('Command Form Error:', err);
        this.errorMessage = 'Errore di connessione al backend: ' + (err.message || 'Server error');
        this.statusMessage = 'Errore durante la comunicazione.';
        this.cdr.detectChanges();
      }
    });
  }

  selectTone(toneCode: string, toneLabel: string): void {
    this.currentTone = toneCode;
    const commandText = `Spiegamelo con registro ${toneCode}`;
    const displayLabel = `🎭 Cambio registro: ${toneLabel}`;
    this.sendFormCommand(commandText, displayLabel);
  }

  selectLength(lengthValue: number, label: string): void {
    this.currentLength = lengthValue;
    let commandText = 'Spiegazione standard di 30 secondi';
    if (lengthValue === 15) {
      commandText = 'Accorcia e riduci la spiegazione a 15 secondi';
    } else if (lengthValue === 60) {
      commandText = 'Allunga e fornisci una spiegazione estesa di 60 secondi';
    }
    const displayLabel = `⏱️ Imposta durata: ${label}`;
    this.sendFormCommand(commandText, displayLabel);
  }

  selectPoi(commandText: string, label: string): void {
    const displayLabel = `🗺️ Indicazioni per: ${label}`;
    this.sendFormCommand(commandText, displayLabel);
  }

  navigateArtwork(action: 'explain' | 'author' | 'next' | 'prev'): void {
    let commandText = '';
    let displayLabel = '';
    switch (action) {
      case 'explain':
        commandText = 'Spiegami quest\'opera';
        displayLabel = '🖼️ Spiega Opera Corrente';
        break;
      case 'author':
        commandText = 'Chi è l\'autore di quest\'opera?';
        displayLabel = '🎨 Info Autore';
        break;
      case 'next':
        commandText = 'Passa alla prossima opera';
        displayLabel = '⏩ Prossima Opera';
        break;
      case 'prev':
        commandText = 'Torna all\'opera precedente';
        displayLabel = '⏪ Opera Precedente';
        break;
    }
    this.sendFormCommand(commandText, displayLabel);
  }

  speakMessage(message: ChatMessage): void {
    if (!message || !message.text) return;
    message.isSpeaking = true;
    this.isSpeaking = true;
    this.navigatorService.speakText(message.text, this.selectedLang).then(() => {
      message.isSpeaking = false;
      this.isSpeaking = false;
      this.cdr.detectChanges();
    });
  }

  testTTSManual(text: string): void {
    if (!text) return;
    this.isSpeaking = true;
    this.navigatorService.speakText(text, this.selectedLang).then(() => {
      this.isSpeaking = false;
      this.cdr.detectChanges();
    });
  }

  clearLogs(): void {
    this.logs = [];
    this.lastLog = null;
  }

  clearChat(): void {
    this.chatMessages = [{
      id: 'welcome',
      sender: 'bot',
      text: '👋 Chat resettata. Come posso aiutarti?',
      timestamp: new Date().toLocaleTimeString()
    }];
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatScrollContainer) {
        this.chatScrollContainer.nativeElement.scrollTop = this.chatScrollContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }
}
