import { Component, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Itinerary } from '../../components/itinerary/itinerary';
import { Chat } from '../../components/chat/chat';
import { NavigatorService, StreamChunk } from '../../services/navigator.service';
import { VisitService } from '../../services/visit.service';
import { GroupSocketService } from '../../services/group-socket.service';
import { QuizService } from '../../services/quiz.service';
import { QuizModal } from '../../components/quiz-modal/quiz-modal';
import { NavigatorSettings } from '../../components/navigator-settings/navigator-settings';
import { ToneType, UserNavigatorSettings } from '../../models/appModel/userNavigatorSettings';
import { NavigatorRequest } from '../../models/navigator.model';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, skip, switchMap } from 'rxjs/operators';
import { Map } from '../../components/map/map';
import { ChatMessage } from '../../models/appModel/chatMessage';
import { ArtworkResponse } from '../../models/artwork.model';

import { dummyItinerary, dummyArtwork, DUMMY_ITINERARY_ARTWORKS } from './dummy'

const settingsKey = 'navigatorSettings'

@Component({
  selector: 'app-navigator',
  standalone: true,
  imports: [CommonModule, FormsModule, Itinerary, Chat, NavigatorSettings, Map, QuizModal],
  templateUrl: './navigator.html',
  styleUrl: './navigator.css'
})
export class Navigator {
  private navigatorService = inject(NavigatorService);
  private visitService = inject(VisitService);
  protected socketService = inject(GroupSocketService);
  private quizService = inject(QuizService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Quiz Finale
  isQuizModalOpen = signal<boolean>(false);
  isGeneratingQuiz = signal<boolean>(false);
  availableQuizzes = signal<any[]>([]);

  // Stati UI
  isPlaying = signal<boolean>(false);
  showSubtitles = signal<boolean>(true);
  isSettingsOpen = signal<boolean>(false);
  isMapOpen = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  // contesto
  museumId = signal<string>('650c1f1e1c9d440000a1b2c3');
  visitId = signal<string>('650c1f1e1c9d440000a1b2c4');

  // Visite di gruppo
  sessionCode = signal<string | null>(null);
  isGroup = signal<boolean>(false);
  isTeacher = signal<boolean>(false);
  audioSummary = computed(() => this.socketService.studentsAudioSummary());

  //Setting
  currentSettings = signal<UserNavigatorSettings>({
    tone: 'adulto',
    language: 'it',
    duration: 30
  });

  // Chat e Dettatura
  messages = signal<ChatMessage[]>([
    { sender: 'ai', text: 'Benvenuto! Sono la tua guida virtuale. Come posso aiutarti oggi?' }
  ]);
  isDictating = signal<boolean>(false);

  // Audio recording e playback
  private isVoiceUpdatingSettings = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private currentAudio: HTMLAudioElement | null = null;
  audioCurrentTime = signal<number>(0);
  audioDuration = signal<number>(0);

  audioProgressPercent = computed<number>(() => {
    const dur = this.audioDuration();
    return dur > 0 ? Math.min(100, (this.audioCurrentTime() / dur) * 100) : 0;
  });

  formattedTime = computed<string>(() => {
    const cur = this.formatTime(this.audioCurrentTime());
    const dur = this.formatTime(this.audioDuration());
    return `${cur} / ${dur}`;
  });

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
      debounceTime(400) // Aspetta mezzo secondo di inattività
    ).subscribe(() => {
      if (!this.isVoiceUpdatingSettings) {
        this.executeCommand({ itemAction: 'EXPLAIN_ITEM' });
      }
    });

    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe(params => {
      if (params['museumId'] && typeof params['museumId'] === 'string' && params['museumId'].length === 24) {
        this.museumId.set(params['museumId']);
      }
      if (params['visitId']) {
        this.visitId.set(params['visitId']);
        this.loadVisitData(params['visitId']);
      }
      if (params['sessionCode']) {
        const code = params['sessionCode'].toUpperCase().trim();
        this.sessionCode.set(code);
        this.isGroup.set(true);
        const isTeacherUser = params['isTeacher'] === 'true';
        this.isTeacher.set(isTeacherUser);

        if (!isTeacherUser) {
          this.messages.set([
            {
              sender: 'ai',
              text: 'Benvenuto alla visita di gruppo! La navigazione è sincronizzata e guidata dal tuo docente. Puoi ascoltare la guida, approfondire l\'opera corrente o chiedere informazioni sui servizi del museo.'
            }
          ]);
        }

        // Connetti WebSocket se non già connesso
        this.socketService.connect(code);

        // Se lo studente riceve il cambio tappa dal docente, si sincronizza automaticamente
        this.socketService.onStepChanged((data) => {
          if (!this.isTeacher() && typeof data?.stepIndex === 'number') {
            console.log('[Navigator] Step sincronizzato dal docente:', data.stepIndex);
            if (this.currentAudio) {
              this.currentAudio.pause();
              this.currentAudio = null;
            }
            this.isPlaying.set(false);
            this.audioCurrentTime.set(0);
            this.audioDuration.set(0);

            this.currentItineraryStepIndex.set(data.stepIndex);
            this.executeCommand({ itemAction: 'EXPLAIN_ITEM', currentArtworkIndex: data.stepIndex });
          }
        });

        // Se la sessione viene conclusa dal docente
        this.socketService.onSessionEnded((data: any) => {
          this.isQuizModalOpen.set(false);
          if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
          }
          this.isPlaying.set(false);
          this.socketService.disconnect();

          const targetMuseumId = data?.museumId || this.museumId();
          if (targetMuseumId && /^[0-9a-fA-F]{24}$/.test(targetMuseumId)) {
            this.router.navigate(['/marketplace', targetMuseumId]);
          } else {
            this.router.navigate(['/']);
          }
        });

        // Ricezione avvio quiz finale per tutti i partecipanti
        this.socketService.onQuizStarted((data) => {
          console.log('[Navigator] Quiz finale avviato:', data);
          this.isQuizModalOpen.set(true);
        });
      }
    });
  }

  //TODO navigator service inject
  //TODO chiamate api facili inziali come per prendere l'itinerario e tutta la visita si usa to signal

  private loadVisitData(vId: string): void {
    // Carica eventuali quiz disponibili per la visita
    this.quizService.getQuizzesByVisit(vId).pipe(takeUntilDestroyed()).subscribe({
      next: (res) => this.availableQuizzes.set(res.data || []),
      error: () => {}
    });

    // Svuota la chat e reimposta lo stato audio per la nuova visita
    this.messages.set([
      { sender: 'ai', text: 'Benvenuto! Sono la tua guida virtuale per questa visita. Come posso aiutarti?' }
    ]);
    this.currentItineraryStepIndex.set(0);
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    this.isPlaying.set(false);
    this.audioCurrentTime.set(0);
    this.audioDuration.set(0);

    this.visitService.getById(vId).pipe(takeUntilDestroyed()).subscribe({
      next: (visitData: any) => {
        const rawSteps = visitData?.steps || visitData?.visits || [];
        if (rawSteps && rawSteps.length > 0) {
          const artworks: ArtworkResponse[] = rawSteps.map((v: any, index: number) => {
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

  private lastAudioUrl: string | null = null;

  async executeCommand(extraParams: Partial<NavigatorRequest> = {}, audioBlob?: Blob): Promise<void> {
    const settings = this.currentSettings();

    // Se è uno studente in visita di gruppo, rimane forzatamente ancorato alla tappa sincronizzata dal docente
    if (this.isGroup() && !this.isTeacher()) {
      extraParams.currentArtworkIndex = this.currentItineraryStepIndex();
    }

    const request: NavigatorRequest = {
      museumId: this.museumId(),
      visitId: this.visitId(),
      currentArtworkIndex: this.currentItineraryStepIndex(),
      language: settings.language,
      tone: settings.tone,
      length: settings.duration,
      isGroup: this.isGroup(),
      isTeacher: this.isTeacher(),
      sessionCode: this.sessionCode() || undefined,
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

          // Aggiorna l'indice dell'opera se il comando ha navigato verso un'altra opera
          let targetIndex: number | null = null;
          if (chunk.data?.currentArtworkIndex !== undefined && chunk.data?.currentArtworkIndex !== null) {
            targetIndex = Number(chunk.data.currentArtworkIndex);
          } else if (chunk.data?.itemAction === 'NEXT_ITEM') {
            targetIndex = this.currentItineraryStepIndex() + 1;
          } else if (chunk.data?.itemAction === 'PREVIOUS_ITEM') {
            targetIndex = this.currentItineraryStepIndex() - 1;
          }

          if (targetIndex !== null && !isNaN(targetIndex) && targetIndex >= 0 && targetIndex < this.itinerary().length) {
            if (targetIndex !== this.currentItineraryStepIndex()) {
              this.currentItineraryStepIndex.set(targetIndex);
              if (this.isGroup() && this.isTeacher() && this.sessionCode()) {
                this.socketService.changeStep(this.sessionCode()!, '', targetIndex).catch(err => {
                  console.warn('Errore broadcast step change da comando vocale:', err);
                });
              }
            }
          }

          // Aggiorna eventuali impostazioni modificate a voce
          if (chunk.data?.tone || chunk.data?.language || chunk.data?.length) {
            this.isVoiceUpdatingSettings = true;
            this.currentSettings.update(curr => {
              const updated = { ...curr };
              if (chunk.data?.language) updated.language = chunk.data.language;
              if (chunk.data?.tone) {
                const t = chunk.data.tone;
                if (t === 'infantile') updated.tone = 'bambino';
                else if (t === 'simple') updated.tone = 'studente';
                else if (t === 'medium') updated.tone = 'adulto';
                else if (t === 'technical' || t === 'thecnical') updated.tone = 'specialista';
                else if (['bambino', 'studente', 'adulto', 'specialista'].includes(t)) updated.tone = t as any;
              }
              if (chunk.data?.length !== undefined && chunk.data?.length !== null) {
                const l = Number(chunk.data.length);
                if (!isNaN(l)) updated.duration = l;
              }
              return updated;
            });
            setTimeout(() => {
              this.isVoiceUpdatingSettings = false;
            }, 600);
          }

          const audioData = chunk.data?.audio;
          if (audioData) {
            this.lastAudioUrl = audioData;
            this.isPlaying.set(true);
            this.playAudioSource(audioData);
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
    this.isPlaying.set(willPlay);

    if (willPlay) {
      if (this.currentAudio) {
        this.currentAudio.play().then(() => {
          if (this.isGroup() && !this.isTeacher() && this.sessionCode()) {
            this.socketService.sendAudioStatus(this.sessionCode()!, this.currentItineraryStepIndex(), 'listening');
          }
        }).catch(err => {
          console.warn('Playback audio non consentito dal browser:', err);
          this.isPlaying.set(false);
        });
      } else if (this.lastAudioUrl) {
        this.playAudioSource(this.lastAudioUrl);
      }
    } else {
      if (this.currentAudio) {
        this.currentAudio.pause();
        if (this.isGroup() && !this.isTeacher() && this.sessionCode()) {
          this.socketService.sendAudioStatus(this.sessionCode()!, this.currentItineraryStepIndex(), 'paused');
        }
      }
    }
  }

  formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  seekAudio(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;
    if (width <= 0) return;

    const percent = Math.max(0, Math.min(1, clickX / width));

    if (!this.currentAudio && this.lastAudioUrl) {
      this.initAudioElement(this.lastAudioUrl);
    }

    if (this.currentAudio) {
      const dur = this.currentAudio.duration || this.audioDuration() || 0;
      if (dur > 0) {
        const newTime = percent * dur;
        this.currentAudio.currentTime = newTime;
        this.audioCurrentTime.set(newTime);
      }
    }
  }

  private initAudioElement(src: string): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    this.currentAudio = new Audio(src);
    this.currentAudio.ontimeupdate = () => {
      if (this.currentAudio) {
        this.audioCurrentTime.set(this.currentAudio.currentTime);
      }
    };
    this.currentAudio.onloadedmetadata = () => {
      if (this.currentAudio) {
        this.audioDuration.set(this.currentAudio.duration || 0);
      }
    };
    this.currentAudio.onended = () => {
      this.isPlaying.set(false);
      this.audioCurrentTime.set(0);
      if (this.isGroup() && !this.isTeacher() && this.sessionCode()) {
        this.socketService.sendAudioStatus(this.sessionCode()!, this.currentItineraryStepIndex(), 'completed');
      }
    };
    this.currentAudio.onpause = () => {
      if (this.isGroup() && !this.isTeacher() && this.sessionCode()) {
        const dur = this.audioDuration();
        const cur = this.audioCurrentTime();
        if (cur > 0 && cur < dur - 0.5) {
          this.socketService.sendAudioStatus(this.sessionCode()!, this.currentItineraryStepIndex(), 'paused');
        }
      }
    };
    this.currentAudio.onplay = () => {
      if (this.isGroup() && !this.isTeacher() && this.sessionCode()) {
        this.socketService.sendAudioStatus(this.sessionCode()!, this.currentItineraryStepIndex(), 'listening');
      }
    };
    this.currentAudio.onerror = () => this.isPlaying.set(false);
  }

  private playAudioSource(src: string): void {
    this.initAudioElement(src);
    if (this.currentAudio) {
      this.currentAudio.play().then(() => {
        if (this.isGroup() && !this.isTeacher() && this.sessionCode()) {
          this.socketService.sendAudioStatus(this.sessionCode()!, this.currentItineraryStepIndex(), 'listening');
        }
      }).catch(err => {
        console.warn('Playback audio non consentito dal browser:', err);
        this.isPlaying.set(false);
      });
    }
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

  askAuthor(): void {
    console.log("Richiesta informazioni sull'autore dell'opera...");
    this.messages.update(msgs => [...msgs, { sender: 'user', text: "Parlami dell'autore di quest'opera.", type: 'text' }]);
    this.executeCommand({ targetArtist: 'CURRENT_AUTHOR' });
  }

  askPoi(poiType: string, label: string): void {
    this.messages.update(msgs => [...msgs, { sender: 'user', text: `Dove si trova: ${label}?`, type: 'text' }]);
    this.executeCommand({ targetPoiType: poiType });
  }

  changeItineraryStep(index: number): void {
    if (this.isGroup() && !this.isTeacher()) {
      console.warn('[Navigator] Navigazione non consentita: la visita è guidata dal docente.');
      return;
    }

    if (index === this.currentItineraryStepIndex()) {
      return;
    }

    // Se è il docente in una visita di gruppo e alcuni studenti non hanno finito, mostra un avviso ma permette di procedere
    if (this.isGroup() && this.isTeacher()) {
      const summary = this.audioSummary();
      if (summary && summary.totalStudents > 0 && summary.completedCount < summary.totalStudents) {
        const notDone = summary.totalStudents - summary.completedCount;
        const msg = notDone === 1
          ? `Attenzione: 1 studente non ha ancora completato l'ascolto di questa tappa.\n\nVuoi procedere comunque per tutto il gruppo?`
          : `Attenzione: ${notDone} studenti non hanno ancora completato l'ascolto di questa tappa.\n\nVuoi procedere comunque per tutto il gruppo?`;
        const proceed = window.confirm(msg);
        if (!proceed) {
          return;
        }
      }
    }

    this.currentItineraryStepIndex.set(index);
    this.executeCommand({ itemAction: 'EXPLAIN_ITEM', currentArtworkIndex: index });

    // Se è il docente in una visita di gruppo, sincronizza tutti gli studenti
    if (this.isGroup() && this.isTeacher() && this.sessionCode()) {
      this.socketService.changeStep(this.sessionCode()!, '', index).catch(err => {
        console.warn('Errore broadcast step change:', err);
      });
    }
  }

  nextArtwork(): void {
    if (this.isGroup() && !this.isTeacher()) return;
    const nextIdx = this.currentItineraryStepIndex() + 1;
    if (nextIdx < this.itinerary().length) {
      this.changeItineraryStep(nextIdx);
    }
  }

  prevArtwork(): void {
    if (this.isGroup() && !this.isTeacher()) return;
    const prevIdx = this.currentItineraryStepIndex() - 1;
    if (prevIdx >= 0) {
      this.changeItineraryStep(prevIdx);
    }
  }

  async startGroupQuiz(): Promise<void> {
    const code = this.sessionCode();
    const vId = this.visitId();
    if (!code) return;

    this.isGeneratingQuiz.set(true);

    try {
      let quizzes = this.availableQuizzes();
      let quizId = quizzes.length > 0 ? (quizzes[0]._id || quizzes[0].id) : null;

      if (!quizId && vId) {
        const genRes = await firstValueFrom(this.quizService.generateQuiz({
          visitId: vId,
          numberOfQuestions: 5,
          difficulty: 'medium',
          targetAge: 'studente',
          language: this.currentSettings().language || 'it'
        }));
        if (genRes?.data?._id || genRes?.data?.id) {
          quizId = genRes.data._id || genRes.data.id;
        }
      }

      if (quizId) {
        await this.socketService.startQuiz(code, undefined, quizId);
        this.isQuizModalOpen.set(true);
      }
    } catch (err) {
      console.error('[Navigator] Errore avvio quiz di gruppo:', err);
    } finally {
      this.isGeneratingQuiz.set(false);
    }
  }

  endGroupVisit(): void {
    const code = this.sessionCode();
    const musId = this.museumId();
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    this.isPlaying.set(false);
    this.isQuizModalOpen.set(false);

    if (code) {
      this.socketService.endSession(code, '')
        .finally(() => {
          this.socketService.disconnect();
          if (musId && /^[0-9a-fA-F]{24}$/.test(musId)) {
            this.router.navigate(['/marketplace', musId]);
          } else {
            this.router.navigate(['/']);
          }
        });
    } else {
      this.socketService.disconnect();
      if (musId && /^[0-9a-fA-F]{24}$/.test(musId)) {
        this.router.navigate(['/marketplace', musId]);
      } else {
        this.router.navigate(['/']);
      }
    }
  }
}
