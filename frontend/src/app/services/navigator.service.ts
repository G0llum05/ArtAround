import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface StreamChunk {
  // check backend codes
  type: 'TRANSCRIPTION' | 'FINAL_RESPONSE' | 'ERROR';
  success: boolean;
  text?: string;
  data?: { text?: string;[key: string]: any };
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NavigatorService {
  private readonly apiUrl = `${environment.apiUrl}/navigator`;

  async sendNavigatorCommandStream(
    formData: FormData,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok && !response.body) {
      throw new Error(`Errore HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('ReadableStream non supportato dal server');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Tiene l'eventuale riga incompleta

      for (const line of lines) {
        if (line.trim()) {
          try {
            const parsedChunk: StreamChunk = JSON.parse(line);
            onChunk(parsedChunk);
          } catch (e) {
            console.error('Errore parsing chunk JSON:', e);
          }
        }
      }
    }
  }
}
