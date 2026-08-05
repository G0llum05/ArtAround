import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NavigatorClientService, STTResponse } from '../../services/navigator.service';

export interface LanguageOption {
  code: string;
  name: string;
  flag: string;
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
  // State flags
  isRecording = false;
  isProcessing = false;
  isSpeaking = false;
  errorMessage: string | null = null;
  statusMessage = 'Pronto all\'ascolto. Seleziona la lingua e clicca sul microfono.';

  // Audio & Recording properties
  private mediaRecorder: MediaRecorder | null = null;
  private currentStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private recStartTime = 0;
  public recDurationMs = 0;
  private recTimerInterval: any = null;
  public audioUrl: string | null = null;

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
      this.statusMessage = '⏳ Invio buffer RAM al server Express & trascrizione Groq STT...';
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

    this.navigatorService.transcribeAudio(audioBlob, this.selectedLang).subscribe({
      next: async (res: STTResponse) => {
        const totalRoundtripMs = Math.round(performance.now() - overallStart);
        this.isProcessing = false;

        if (res && res.success) {
          this.latestTranscript = res.text || '(Nessun testo rilevato)';
          this.statusMessage = `✅ Trascrizione completata (${res.sttProcessMs}ms): "${this.latestTranscript}"`;

          // Sintesi Vocale TTS lato client via ResponsiveVoice API Client (con fallback Web Speech API)
          let ttsStatus = 'Disattivato';
          if (this.autoSpeakTTS && this.latestTranscript) {
            this.isSpeaking = true;
            this.statusMessage = `🔊 Riproduzione TTS (ResponsiveVoice Client)...`;
            this.cdr.detectChanges();

            await this.navigatorService.speakText(this.latestTranscript, this.selectedLang);
            this.isSpeaking = false;
            ttsStatus = 'Riprodotto con successo';
            this.statusMessage = '🏁 Flusso STT -> Server Express -> ResponsiveVoice TTS completato con successo!';
          }

          const logItem: ProcessLog = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            transcript: this.latestTranscript,
            recDurationMs: this.recDurationMs,
            sttProcessMs: res.sttProcessMs,
            totalBackendMs: res.totalBackendMs,
            totalRoundtripMs,
            ttsStatus,
            audioSizeKb: `${audioSizeKb} KB`,
            lang: this.selectedLang,
            status: 'success'
          };

          this.lastLog = logItem;
          this.logs.unshift(logItem);
        } else {
          this.errorMessage = res.error || 'Errore durante la trascrizione Groq STT.';
          this.statusMessage = 'Errore trascrizione audio.';
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isProcessing = false;
        console.error('STT Request Error:', err);
        this.errorMessage = 'Errore di connessione al backend: ' + (err.message || 'Server error');
        this.statusMessage = 'Errore durante l\'invio al backend.';
        this.cdr.detectChanges();
      }
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
}
