import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  constructor(private http: HttpClient) {}

  /**
   * Invia un Blob audio al backend Express per la trascrizione STT via Groq API.
   * Imposta il cookie di sessione per la lingua e invia FormData in RAM.
   */
  transcribeAudio(audioBlob: Blob, lang: string = 'it'): Observable<STTResponse> {
    // Imposta il cookie di sessione 'lang' per la lingua selezionata
    document.cookie = `lang=${lang}; path=/; max-age=86400`;

    const formData = new FormData();
    const ext = audioBlob.type.includes('ogg') ? 'ogg' : audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
    formData.append('audio', audioBlob, `recording.${ext}`);
    formData.append('language', lang);

    const targetUrl = window.location.port === '4200' 
      ? 'http://localhost:8000/api/navigator/transcribe' 
      : `${this.apiBaseUrl}/transcribe`;

    return this.http.post<STTResponse>(targetUrl, formData, { withCredentials: true });
  }

  /**
   * Esegue la sintesi vocale TTS lato client tramite l'API nativa SpeechSynthesis (Web Speech API).
   * Nessun carico sul server, esecuzione sub-secondo locale.
   */
  speakText(text: string, langCode: string = 'it'): Promise<{ ttsMs: number }> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window) || !text) {
        resolve({ ttsMs: 0 });
        return;
      }

      window.speechSynthesis.cancel(); // Annulla eventuali frasi precedenti

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Normalizzazione lingua per SpeechSynthesisUtterance
      let langTag = 'it-IT';
      const cleanLang = (langCode || 'it').toLowerCase();
      if (cleanLang.includes('en') || cleanLang.includes('us')) langTag = 'en-US';
      else if (cleanLang.includes('fr') || cleanLang.includes('fra')) langTag = 'fr-FR';
      else if (cleanLang.includes('sp') || cleanLang.includes('es')) langTag = 'es-ES';
      else if (cleanLang.includes('de')) langTag = 'de-DE';
      else if (cleanLang.includes('cn') || cleanLang.includes('zh')) langTag = 'zh-CN';
      else if (cleanLang.includes('ru') || cleanLang.includes('rus')) langTag = 'ru-RU';

      utterance.lang = langTag;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Trova la voce corrispondente alla lingua selezionata
      const voices = window.speechSynthesis.getVoices();
      const prefix = langTag.substring(0, 2);
      const matchingVoice = voices.find(v => v.lang.startsWith(prefix) || v.lang.toLowerCase().includes(prefix));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      const startTtsTime = performance.now();

      utterance.onend = () => {
        const ttsMs = Math.round(performance.now() - startTtsTime);
        resolve({ ttsMs });
      };

      utterance.onerror = (err) => {
        console.warn('SpeechSynthesis error:', err);
        const ttsMs = Math.round(performance.now() - startTtsTime);
        resolve({ ttsMs });
      };

      window.speechSynthesis.speak(utterance);
    });
  }
}
