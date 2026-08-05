import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { AlertService } from './alert.service';

export interface STTResponse {
  success: boolean;
  text: string;
  reply?: string;
  sttProcessMs: number;
  totalBackendMs: number;
  audioSizeBytes?: number;
  pcmSizeBytes?: number;
  error?: string;
}

export interface CommandResponse {
  success: boolean;
  text: string;
  reply?: string;
  sttProcessMs: number;
  totalBackendMs: number;
  result?: any;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NavigatorClientService {
  private apiBaseUrl = '/api/navigator';
  private voices: SpeechSynthesisVoice[] = [];
  private alertService: AlertService = new AlertService();

  private currentAudio: HTMLAudioElement | null = null;
  private currentAbortController: AbortController | null = null;

  constructor(private http: HttpClient) {
    this.initVoices();
  }

  initVoices(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.voices = window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.voices = window.speechSynthesis.getVoices();
      };
    }
  }

  /**
   * Richiede lo stream audio sintetizzato dal backend Express (che gestisce ResponsiveVoiceAPIClient in modo sicuro).
   * Nessuna API Key o Secret è esposta al client.
   */
  async synthesizeAudioFromBackend(text: string, lang: string = 'it'): Promise<Blob> {
    const targetUrl = (typeof window !== 'undefined' && window.location.port === '4200')
      ? `http://localhost:8000/api/navigator/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}`
      : `${this.apiBaseUrl}/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}`;

    const blob = await firstValueFrom(
      this.http.get(targetUrl, { responseType: 'blob', withCredentials: true })
    );

    return blob;
  }

  /**
   * Riproduce il testo parlato richiedendo l'audio al backend (ResponsiveVoice sicura via server).
   * Supporta interruzione tramite AbortController e fallback su Web Speech API.
   */
  async speakText(text: string, lang: string = 'it'): Promise<void> {
    this.cancelSpeech();

    this.currentAbortController = new AbortController();
    const signal = this.currentAbortController.signal;

    try {
      const audioBlob = await this.synthesizeAudioFromBackend(text, lang);

      if (signal.aborted) {
        return;
      }

      if (audioBlob && audioBlob.size > 0) {
        const audioUrl = URL.createObjectURL(audioBlob);

        return new Promise<void>((resolve, reject) => {
          const audio = new Audio(audioUrl);
          this.currentAudio = audio;

          audio.onended = () => {
            this.currentAudio = null;
            URL.revokeObjectURL(audioUrl);
            resolve();
          };

          audio.onerror = (e) => {
            this.currentAudio = null;
            URL.revokeObjectURL(audioUrl);
            reject(e);
          };

          if (signal.aborted) {
            URL.revokeObjectURL(audioUrl);
            reject(new Error('Riproduzione annullata.'));
            return;
          }

          audio.play().catch(reject);
        });
      }
    } catch (err: any) {
      if (signal.aborted) {
        return;
      }
      console.warn('Backend TTS fallito o non disponibile, fallback su window.speechSynthesis...', err);
      return this.speakTextBrowserFallback(text, lang);
    }
  }

  /**
   * Annulla qualsiasi sintesi o riproduzione in corso.
   */
  cancelSpeech(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  private speakTextBrowserFallback(text: string, lang: string): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      const cleanLang = (lang || 'it').toLowerCase();
      if (cleanLang.includes('en')) utterance.lang = 'en-US';
      else if (cleanLang.includes('fr')) utterance.lang = 'fr-FR';
      else if (cleanLang.includes('es') || cleanLang.includes('sp')) utterance.lang = 'es-ES';
      else if (cleanLang.includes('de')) utterance.lang = 'de-DE';
      else if (cleanLang.includes('cn') || cleanLang.includes('zh')) utterance.lang = 'zh-CN';
      else if (cleanLang.includes('ru')) utterance.lang = 'ru-RU';
      else utterance.lang = 'it-IT';

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Invia un Blob audio al backend Express per la trascrizione STT via Groq API.
   * Imposta il cookie di sessione per la lingua e invia FormData in RAM.
   */
  transcribeAudio(audioBlob: Blob, lang: string = 'it'): Observable<STTResponse> {
    if (typeof document !== 'undefined') {
      document.cookie = `lang=${lang}; path=/; max-age=86400`;
    }

    const formData = new FormData();
    const ext = audioBlob.type.includes('ogg') ? 'ogg' : audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
    formData.append('audio', audioBlob, `recording.${ext}`);
    formData.append('language', lang);

    const targetUrl = (typeof window !== 'undefined' && window.location.port === '4200')
      ? 'http://localhost:8000/api/navigator/transcribe' 
      : `${this.apiBaseUrl}/transcribe`;

    return this.http.post<STTResponse>(targetUrl, formData, { withCredentials: true });
  }
}
