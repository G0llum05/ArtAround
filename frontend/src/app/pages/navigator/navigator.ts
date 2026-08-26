import { Component, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Itinerary } from '../../components/itinerary/itinerary';
import { Chat } from '../../components/chat/chat';
import { NavigatorService, StreamChunk } from '../../services/navigator.service';
import { VisitService } from '../../services/visit.service';
import { NavigatorSettings } from '../../components/navigator-settings/navigator-settings';
import { ToneType, UserNavigatorSettings } from '../../models/appModel/userNavigatorSettings';
import { NavigatorRequest } from '../../models/navigator.model';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, skip, switchMap } from 'rxjs/operators';
import { Map } from '../../components/map/map';
import { ChatMessage } from '../../models/appModel/chatMessage';
import { ArtworkResponse } from '../../models/artwork.model';

import { dummyItinerary, dummyArtwork, DUMMY_ITINERARY_ARTWORKS, messagesDummy } from './dummy'

const settingsKey = 'navigatorSettings'

@Component({
  selector: 'app-navigator',
  standalone: true,
  imports: [CommonModule, FormsModule, Itinerary, Chat, NavigatorSettings, Map],
  templateUrl: './navigator.html',
  styleUrl: './navigator.css'
})
export class Navigator {
  private navigatorService = inject(NavigatorService);
  private visitService = inject(VisitService);
  private route = inject(ActivatedRoute);

  // Stati UI
  isPlaying = signal<boolean>(false);
  showSubtitles = signal<boolean>(true);
  isSettingsOpen = signal<boolean>(false);
  isMapOpen = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  // contesto
  museumId = signal<string>('650c1f1e1c9d440000a1b2c3');
  visitId = signal<string>('650c1f1e1c9d440000a1b2c4');

  //Setting
  currentSettings = signal<UserNavigatorSettings>({
    tone: 'adulto',
    language: 'it',
    duration: 30
  });

  // Chat e Dettatura
  messages = signal<ChatMessage[]>(messagesDummy);
  isDictating = signal<boolean>(false);

  // Audio recording e playback
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private currentAudio: HTMLAudioElement | null = null;

  //effect sempre nel costruttore per injection contest
  constructor() {
    const saved = localStorage.getItem(settingsKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      this.currentSettings.update(current => ({ ...current, ...parsed })); //così se i dati non sono completi si completano
    }

    effect(() => {
      localStorage.setItem(settingsKey, JSON.stringify(this.currentSettings()));
    })

    toObservable(this.currentSettings).pipe(
      takeUntilDestroyed(), // Chiude il tubo se il componente viene distrutto
      skip(1), // Opzionale: evita di fare la chiamata API al primo caricamento della pagina (quando legge dal localStorage)
      debounceTime(500), // Aspetta mezzo secondo di inattività
      switchMap(settings => {
        console.log("Salvataggio sul server in corso...", settings);
        // return this.apiService.updateNavigatorSettings(settings);
        return [];
      })
    ).subscribe();

    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe(params => {
      if (params['museumId'] && typeof params['museumId'] === 'string' && params['museumId'].length === 24) {
        this.museumId.set(params['museumId']);
      }
      if (params['visitId']) {
        this.visitId.set(params['visitId']);
        this.loadVisitData(params['visitId']);
      }
    });
  }

  //TODO navigator service inject
  //TODO chiamate api facili inziali come per prendere l'itinerario e tutta la visita si usa to signal

  private loadVisitData(vId: string): void {
    this.visitService.getById(vId).pipe(takeUntilDestroyed()).subscribe({
      next: (visitData: any) => {
        if (visitData?.visits && visitData.visits.length > 0) {
          const artworks: ArtworkResponse[] = visitData.visits.map((v: any, index: number) => {
            const art = v.artwork && typeof v.artwork === 'object' ? v.artwork : null;
            return {
              id: art?._id || art?.id || v.artworkId || `art-${index}`,
              title: art?.title || v.artworkTitle || (typeof v.artwork === 'string' ? v.artwork : `Tappa ${index + 1}`),
              description: art?.description || '',
              startYear: art?.startYear || 0,
              endYear: art?.endYear || 0,
              artists: art?.artists || [],
              museum: art?.museum || ({} as any),
              location: art?.location || { room: `Sala ${index + 1}`, floor: 'Piano Terra', build: 'Ala Principale' },
              dimensions: art?.dimensions || { height: 0, width: 0, depth: 0, unit: 'cm' },
              artisticCurrents: art?.artisticCurrents || [],
              details: art?.details || { subjects: [], colors: [], places: [], objectType: 'Opera', materials: [], technique: [] },
              copyOf: null as any,
              falsificationOf: null as any,
              isActive: true,
              isPrivate: false,
              qrCode: art?.qrCode || `QR-${index + 1}`,
              assets: art?.assets || { images: [{ url: '/assets/images/place_holder.jpg', orientation: 'landscape' }] }
            };
          });
          this.itinerary.set(artworks);
        }
        if (visitData?.museumId && typeof visitData.museumId === 'string' && visitData.museumId.length === 24) {
          this.museumId.set(visitData.museumId);
        }
      },
      error: (err) => {
        console.warn('Caricamento dati visita non riuscito, uso itinerario di fallback:', err);
      }
    });
  }

  // Sottotitoli
  currentSubtitle = signal<string>("Nel dipinto possiamo notare i dettagli delle vesti dorate...");

  // Itinerario
  currentItineraryStepIndex = signal<number>(0);
  itinerary = signal<ArtworkResponse[]>(DUMMY_ITINERARY_ARTWORKS);

  currentArtwork = computed<ArtworkResponse | null>(() => {
    const list = this.itinerary();
    const idx = this.currentItineraryStepIndex();
    return list[idx] || list[0] || null;
  });

  async executeCommand(extraParams: Partial<NavigatorRequest> = {}, audioBlob?: Blob): Promise<void> {
    const settings = this.currentSettings();
    const request: NavigatorRequest = {
      museumId: this.museumId(),
      visitId: this.visitId(),
      currentArtworkIndex: this.currentItineraryStepIndex(),
      language: settings.language,
      tone: settings.tone,
      length: settings.duration,
      ...extraParams
    };

    this.isLoading.set(true);

    try {
      await this.navigatorService.sendCommand(request, audioBlob, (chunk: StreamChunk) => {
        if (chunk.type === 'TRANSCRIPTION' && chunk.text) {
          this.messages.update(msgs => {
            const updated = [...msgs];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].sender === 'user') {
              updated[lastIndex] = { ...updated[lastIndex], text: chunk.text! };
            } else {
              updated.push({ sender: 'user', text: chunk.text!, type: 'audio' });
            }
            return updated;
          });
        } else if (chunk.type === 'FINAL_RESPONSE') {
          this.isLoading.set(false);
          const reply = chunk.data?.reply || chunk.data?.text || chunk.text || 'Risposta ricevuta.';
          this.messages.update(msgs => [...msgs, { sender: 'ai', text: reply }]);
          this.currentSubtitle.set(reply);

          if (this.isPlaying()) {
            this.playAudioForText(reply, this.currentSettings().language);
          }
        } else if (chunk.type === 'ERROR') {
          this.isLoading.set(false);
          const errMsg = chunk.error || 'Errore durante la comunicazione con il server.';
          this.messages.update(msgs => [...msgs, { sender: 'ai', text: errMsg }]);
        }
      });
    } catch (err: any) {
      this.isLoading.set(false);
      const errMsg = err?.message || 'Errore di connessione con il navigatore.';
      this.messages.update(msgs => [...msgs, { sender: 'ai', text: errMsg }]);
    }
  }

  togglePlay(): void {
    const willPlay = !this.isPlaying();
    this.isPlaying.update(v => !v);

    if (willPlay) {
      this.playAudioForText(this.currentSubtitle(), this.currentSettings().language);
    } else {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }
    }
  }

  private playAudioForText(text: string, lang: string): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    const url = this.navigatorService.getTTSAudioUrl(text, lang);
    this.currentAudio = new Audio(url);
    this.currentAudio.onended = () => this.isPlaying.set(false);
    this.currentAudio.onerror = () => this.isPlaying.set(false);
    this.currentAudio.play().catch(err => {
      console.warn('Playback audio automatico non consentito dal browser o errore TTS:', err);
      this.isPlaying.set(false);
    });
  }

  toggleSubtitles(): void {
    this.showSubtitles.update(v => !v);
    //TODO subtitles
  }

  async toggleDictation(): Promise<void> {
    //TODO dictation
    if (!this.isDictating()) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
          stream.getTracks().forEach(track => track.stop());
          this.messages.update(msgs => [...msgs, { sender: 'user', text: '🎤 [Elaborazione audio...]', type: 'audio' }]);
          this.executeCommand({}, audioBlob);
        };

        this.mediaRecorder.start();
        this.isDictating.update(v => !v);
      } catch (err) {
        console.error('Impossibile accedere al microfono:', err);
      }
    } else {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      this.isDictating.update(v => !v);
    }
  }

  openSettings(): void {
    this.isSettingsOpen.set(true);
  }

  openMap(): void {
    this.isMapOpen.set(true);
  }

  tellMeMore(): void {
    console.log("Richiesta maggiori informazioni sull'opera...");
    this.messages.update(msgs => [...msgs, { sender: 'user', text: "Dimmi di più sull'opera corrente.", type: 'text' }]);
    this.executeCommand({ itemAction: 'TELL_ME_MORE' });
  }

  askPoi(poiType: string, label: string): void {
    this.messages.update(msgs => [...msgs, { sender: 'user', text: `Dove si trova: ${label}?`, type: 'text' }]);
    this.executeCommand({ targetPoiType: poiType });
  }

  changeItineraryStep(index: number): void {
    this.currentItineraryStepIndex.set(index);
    this.executeCommand({ itemAction: 'EXPLAIN_ITEM', currentArtworkIndex: index });
  }

  nextArtwork(): void {
    const nextIdx = this.currentItineraryStepIndex() + 1;
    if (nextIdx < this.itinerary().length) {
      this.changeItineraryStep(nextIdx);
    }
  }

  prevArtwork(): void {
    const prevIdx = this.currentItineraryStepIndex() - 1;
    if (prevIdx >= 0) {
      this.changeItineraryStep(prevIdx);
    }
  }
}
