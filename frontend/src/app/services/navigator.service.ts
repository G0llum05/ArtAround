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
   * Riproduce il testo parlato richiedendo l'audio al backend (ResponsiveVoice) o tramite Web Speech API nativa.
   * Pulisce il testo da emoji e markdown prima della lettura per garantire un parlato fluido.
   */
  async speakText(text: string, lang: string = 'it'): Promise<void> {
    this.cancelSpeech();

    // Pulisce il testo rimuovendo emoji, simboli speciali e markdown
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[*_#`~]/g, '')
      .trim();

    if (!cleanText) return;

    this.currentAbortController = new AbortController();
    const signal = this.currentAbortController.signal;

    try {
      const audioBlob = await this.synthesizeAudioFromBackend(cleanText, lang);

      if (signal.aborted) {
        return;
      }

      if (audioBlob && audioBlob.size > 0 && audioBlob.type.includes('audio')) {
        const audioUrl = URL.createObjectURL(audioBlob);

        return new Promise<void>((resolve, reject) => {
          const audio = new Audio(audioUrl);
          this.currentAudio = audio;

          audio.onended = () => {
            this.currentAudio = null;
            URL.revokeObjectURL(audioUrl);
            resolve();
          };

          audio.onerror = () => {
            this.currentAudio = null;
            URL.revokeObjectURL(audioUrl);
            // In caso di errore audio stream backend, passa al fallback locale
            this.speakTextBrowserFallback(cleanText, lang).then(resolve);
          };

          if (signal.aborted) {
            URL.revokeObjectURL(audioUrl);
            resolve();
            return;
          }

          audio.play().catch(() => {
            // Se bloccato dalle policy di Autoplay del browser, usa Web Speech API
            this.speakTextBrowserFallback(cleanText, lang).then(resolve);
          });
        });
      } else {
        return this.speakTextBrowserFallback(cleanText, lang);
      }
    } catch (err: any) {
      if (signal.aborted) {
        return;
      }
      return this.speakTextBrowserFallback(cleanText, lang);
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
      try {
        this.currentAudio.pause();
      } catch (e) {}
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
      let targetLang = 'it-IT';
      if (cleanLang.includes('en')) targetLang = 'en-US';
      else if (cleanLang.includes('fr')) targetLang = 'fr-FR';
      else if (cleanLang.includes('es') || cleanLang.includes('sp')) targetLang = 'es-ES';
      else if (cleanLang.includes('de')) targetLang = 'de-DE';
      else if (cleanLang.includes('cn') || cleanLang.includes('zh')) targetLang = 'zh-CN';
      else if (cleanLang.includes('ru')) targetLang = 'ru-RU';
      else targetLang = 'it-IT';

      utterance.lang = targetLang;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Cerca una voce installata nel browser per quella lingua
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const matchingVoice = voices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith(targetLang.slice(0, 2)));
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
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

  /**
   * Invia un comando al Chatbot del Navigatore (può essere audio Blob oppure testo).
   * L'endpoint /api/navigator/command trascrive l'audio (se presente), elabora l'intent
   * tramite NavigatorService e restituisce la risposta parlata del Chatbot.
   */
  sendNavigatorCommand(payload: {
    audioBlob?: Blob;
    inputText?: string;
    visitId?: string;
    currentArtworkIndex?: number;
    currentTone?: string;
    lang?: string;
  }): Observable<CommandResponse> {
    const lang = payload.lang || 'it';
    if (typeof document !== 'undefined') {
      document.cookie = `lang=${lang}; path=/; max-age=86400`;
    }

    const formData = new FormData();
    if (payload.audioBlob) {
      const ext = payload.audioBlob.type.includes('ogg') ? 'ogg' : payload.audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
      formData.append('audio', payload.audioBlob, `recording.${ext}`);
    }
    if (payload.inputText) {
      formData.append('inputText', payload.inputText);
    }
    if (payload.visitId) {
      formData.append('visitId', payload.visitId);
    }
    if (payload.currentArtworkIndex !== undefined && payload.currentArtworkIndex !== null) {
      formData.append('currentArtworkIndex', payload.currentArtworkIndex.toString());
    }
    if (payload.currentTone) {
      formData.append('currentTone', payload.currentTone);
    }
    formData.append('language', lang);

    const targetUrl = (typeof window !== 'undefined' && window.location.port === '4200')
      ? 'http://localhost:8000/api/navigator/command'
      : `${this.apiBaseUrl}/command`;

    return this.http.post<CommandResponse>(targetUrl, formData, { withCredentials: true });
  }

  /**
   * Recupera l'elenco delle visite disponibili per consentire la selezione opzionale di una visita nel chatbot.
   */
  getVisits(): Observable<any> {
    const targetUrl = (typeof window !== 'undefined' && window.location.port === '4200')
      ? 'http://localhost:8000/api/visit'
      : '/api/visit';
    return this.http.get<any>(targetUrl, { withCredentials: true });
  }

  /**
   * Recupera i dettagli completi di una visita reale con le relative opere d'arte ed il museo associato.
   */
  getVisitDetails(visitId: string): Observable<any> {
    const targetUrl = (typeof window !== 'undefined' && window.location.port === '4200')
      ? `http://localhost:8000/api/visit/${visitId}/artwork-images`
      : `/api/visit/${visitId}/artwork-images`;
    return this.http.get<any>(targetUrl, { withCredentials: true });
  }
}
