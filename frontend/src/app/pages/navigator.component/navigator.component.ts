import { Component, OnDestroy, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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
  statusMessage = 'Pronto all\'ascolto. Parla col microfono o scrivi un messaggio.';

  // Audio & Recording properties
  private mediaRecorder: MediaRecorder | null = null;
  private currentStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private recStartTime = 0;
  public recDurationMs = 0;
  private recTimerInterval: any = null;
  public audioUrl: string | null = null;

  // Chatbot State
  public textInputMessage = '';
  public chatMessages: ChatMessage[] = [];
  public selectedVisitId = '';
  public visitsList: any[] = [];
  public currentArtworkIndex = 0;
  public currentTone = 'medium';
  public tonesList = ['infantile', 'simple', 'medium', 'advanced', 'technical'];

  // Quick Action Chips
  public quickActions = [
    { label: '🚻 Bagno', command: 'Dove si trova il bagno?' },
    { label: '🖼️ Prossima opera', command: 'Passa alla prossima opera' },
    { label: '🎨 Chi è l\'autore?', command: 'Chi è l\'autore di quest\'opera?' },
    { label: '👶 Tono Semplice', command: 'Spiegamelo in modo più semplice' },
    { label: '🎓 Tono Avanzato', command: 'Dammi maggiori dettagli tecnici' },
    { label: '🇬🇧 English', command: 'Spiega in inglese' }
  ];

  // Latency Logs & Metrics
  public latestTranscript = '';
  public lastLog: ProcessLog | null = null;
  public logs: ProcessLog[] = [];

  // Language Badges & Selection
  public selectedLang = 'it';
  public languages: LanguageOption[] = [
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'en/us', name: 'English', flag: '🇺🇸' },
    { code: 'fra', name: 'Français', flag: '🇫🇷' },
    { code: 'sp', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'cn', name: '中文', flag: '🇨🇳' },
    { code: 'rus', name: 'Русский', flag: '🇷🇺' }
  ];

  // Options
  public autoSpeakTTS = true;
  public availableVoices: SpeechSynthesisVoice[] = [];

  constructor(
    private navigatorService: NavigatorClientService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Imposta il cookie iniziale per la lingua
    this.setLanguage(this.selectedLang);
    this.loadVoices();
    this.loadVisits();

    // Messaggio iniziale di benvenuto del Chatbot Navigatore
    this.chatMessages.push({
      id: 'welcome',
      sender: 'bot',
      text: '👋 Ciao! Sono l\'Assistente Navigatore di ArtAround. Puoi parlarmi usando il microfono oppure scrivermi in chat. Chiedimi indicazioni logistiche, dettagli sulle opere o cambia il tono della spiegazione!',
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
        if (Array.isArray(data)) {
          this.visitsList = data;
        } else if (data && data.visits) {
          this.visitsList = data.visits;
        }
      },
      error: (err) => {
        console.warn('Visite non caricate:', err);
      }
    });
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

  sendTextMessage(): void {
    if (!this.textInputMessage || !this.textInputMessage.trim() || this.isProcessing) return;

    const userText = this.textInputMessage.trim();
    this.textInputMessage = '';
    this.errorMessage = null;

    // Aggiungi il messaggio dell'utente in chat
    this.chatMessages.push({
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString(),
      source: 'text'
    });
    this.scrollToBottom();

    const overallStart = performance.now();
    this.isProcessing = true;
    this.statusMessage = '⏳ Elaborazione comando testuale...';

    this.navigatorService.sendNavigatorCommand({
      inputText: userText,
      visitId: this.selectedVisitId,
      currentArtworkIndex: this.currentArtworkIndex,
      currentTone: this.currentTone,
      lang: this.selectedLang
    }).subscribe({
      next: async (res: CommandResponse) => {
        const totalRoundtripMs = Math.round(performance.now() - overallStart);
        this.isProcessing = false;

        if (res && res.success) {
          const replyText = res.reply || 'Comando elaborato.';

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

          this.statusMessage = `✅ Risposta Chatbot ricevuta`;

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
            transcript: userText,
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
          this.errorMessage = res.error || 'Errore durante l\'elaborazione del comando.';
          this.statusMessage = 'Errore risposta chatbot.';
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isProcessing = false;
        console.error('Command Text Error:', err);
        this.errorMessage = 'Errore di connessione al backend: ' + (err.message || 'Server error');
        this.statusMessage = 'Errore durante l\'invio del testo.';
        this.cdr.detectChanges();
      }
    });
  }

  sendQuickAction(actionCommand: string): void {
    this.textInputMessage = actionCommand;
    this.sendTextMessage();
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
