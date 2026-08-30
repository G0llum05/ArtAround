import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { NavigatorRequest, TONE_MAPPING } from '../models/navigator.model';
import { ToneType } from '../models/appModel/userNavigatorSettings';

export interface NavigatorResponseData {
  text?: string;
  reply?: string;
  audio?: string;
  currentArtworkIndex?: number | null;
  itemAction?: string | null;
  tone?: string | null;
  language?: string | null;
  length?: number | null;
  [key: string]: any;
}

export interface StreamChunk {
  type: 'TRANSCRIPTION' | 'FINAL_RESPONSE' | 'ERROR';
  success: boolean;
  text?: string;
  data?: NavigatorResponseData;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NavigatorService {
  private readonly apiUrl = `${environment.apiUrl}/navigator`;

  createFormData(request: NavigatorRequest, audioBlob?: Blob): FormData {
    const formData = new FormData();
    formData.append('language', request.language);
    formData.append('length', request.length.toString());
    const toneVal = TONE_MAPPING[request.tone as ToneType] || request.tone;
    formData.append('tone', toneVal);
    formData.append('museumId', request.museumId);
    formData.append('visitId', request.visitId);
    formData.append('currentArtworkIndex', request.currentArtworkIndex.toString());

    if (request.isGroup !== undefined) {
      formData.append('isGroup', request.isGroup.toString());
    }
    if (request.isTeacher !== undefined) {
      formData.append('isTeacher', request.isTeacher.toString());
    }
    if (request.sessionCode) {
      formData.append('sessionCode', request.sessionCode);
    }

    if (request.actionType) {
      formData.append('actionType', request.actionType);
    }
    if (request.itemAction) {
      formData.append('itemAction', request.itemAction);
    }
    if (request.targetPoiType) {
      formData.append('targetPoiType', request.targetPoiType);
    }
    if (request.targetArtist) {
      formData.append('targetArtist', request.targetArtist);
    }
    if (request.userQuery) {
      formData.append('userQuery', request.userQuery);
    }
    if (audioBlob) {
      const mimeType = audioBlob.type || 'audio/webm';
      const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm';
      formData.append('audio', audioBlob, `recording.${ext}`);
    }

    return formData;
  }

  async sendCommand(
    request: NavigatorRequest,
    audioBlob?: Blob,
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<void> {
    const formData = this.createFormData(request, audioBlob);
    await this.sendNavigatorCommandStream(formData, onChunk || (() => {}));
  }

  getTTSAudioUrl(text: string, lang: string = 'it'): string {
    return `${this.apiUrl}/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}`;
  }

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

