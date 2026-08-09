import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
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
   * Invia una richiesta in streaming (NDJSON) all'endpoint /api/navigator
   * Può essere una richiesta Audio (invia 2 chunk: TRANSCRIPTION poi FINAL_RESPONSE)
   * o una richiesta Form (invia 1 chunk: FINAL_RESPONSE).
   */
  async sendStreamRequest(
    formData: FormData,
    onChunk: (chunk: { type: string; success?: boolean; text?: string; data?: any; error?: string }) => void
  ): Promise<void> {
    const targetUrl = (typeof window !== 'undefined' && window.location.port === '4200')
      ? 'http://localhost:8000/api/navigator'
      : `${this.apiBaseUrl}`;

    const response = await fetch(targetUrl, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok && !response.body) {
      throw new Error(`Errore HTTP backend: status ${response.status}`);
    }

    if (!response.body) throw new Error('ReadableStream non supportato dal browser o dal server');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const parsedChunk = JSON.parse(line);
            onChunk(parsedChunk);
          } catch (e) {
            console.error('[NavigatorService] Errore parsing chunk JSON dallo stream:', e);
          }
        }
      }
    }
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
