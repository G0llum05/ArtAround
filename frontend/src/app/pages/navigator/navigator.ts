import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, OnDestroy, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { debounceTime, filter, skip } from 'rxjs/operators';
import { Chat } from '../../components/chat/chat';
import { GroupChat } from '../../components/group-chat/group-chat';
import { Itinerary } from '../../components/itinerary/itinerary';
import { getActiveLanguage } from '../../components/language-selector/language-selector';
import { Map } from '../../components/map/map';
import { NavigatorSettings } from '../../components/navigator-settings/navigator-settings';
import { QuizModal } from '../../components/quiz-modal/quiz-modal';
import { ChatMessage } from '../../models/appModel/chatMessage';
import { UserNavigatorSettings } from '../../models/appModel/userNavigatorSettings';
import { ArtistResponse } from '../../models/artist.model';
import { ArtworkResponse } from '../../models/artwork.model';
import { MuseumResponse } from '../../models/museum.model';
import { NavigatorRequest } from '../../models/navigator.model';
import { ActiveVisitService } from '../../services/active-visit.service';
import { ArtworkService } from '../../services/artwork.service';
import { AuthService } from '../../services/auth.service';
import { GroupSocketService } from '../../services/group-socket.service';
import { GroupService } from '../../services/group.service';
import { MuseumService } from '../../services/museum.service';
import { NavigatorService, StreamChunk } from '../../services/navigator.service';
import { QuizService } from '../../services/quiz.service';
import { VisitService } from '../../services/visit.service';

import { DUMMY_ITINERARY_ARTWORKS } from './dummy';

const settingsKey = 'navigatorSettings'

@Component({
  selector: 'app-navigator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Itinerary,
    Chat,
    NavigatorSettings,
    Map,
    QuizModal,
    GroupChat,
  ],
  templateUrl: './navigator.html',
  styleUrl: './navigator.css',
})
export class Navigator implements OnDestroy {
  private navigatorService = inject(NavigatorService);
  private visitService = inject(VisitService);
  private museumService = inject(MuseumService);
  private artworkService = inject(ArtworkService);
  private groupService = inject(GroupService);
  protected socketService = inject(GroupSocketService);
  protected authService = inject(AuthService);
  private quizService = inject(QuizService);
  protected activeVisitService = inject(ActiveVisitService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  currentUserId = computed(() => {
    const u = this.authService.currentUser();
    return (u?.userId || '') as string;
  });

  // Chat di Gruppo (Stanza)
  isGroupChatOpen = signal<boolean>(false);
  groupMessages = computed<ChatMessage[]>(() => {
    const myId = this.currentUserId();
    const currentUser = this.authService.currentUser();
    const myFullName = currentUser
      ? `${currentUser.name || ''} ${currentUser.surname || ''}`.trim()
      : '';

    return this.socketService.groupMessages().map((msg) => {
      const isMine = !!(msg.senderId && myId && msg.senderId.toString() === myId.toString());
      let displayName = msg.senderName;
      if (isMine && myFullName) {
        displayName = myFullName;
      } else if (!displayName || displayName.includes('@')) {
        displayName = msg.senderRole === 'teacher' ? 'Docente' : 'Studente';
      }

      return {
        sender: isMine ? 'user' : 'group',
        senderName: displayName,
        senderRole: msg.senderRole || 'student',
        senderId: msg.senderId ? msg.senderId.toString() : undefined,
        text: msg.text,
        createdAt: msg.createdAt,
      };
    });
  });
  unreadGroupMessagesCount = signal<number>(0);

  // Quiz Finale
  isQuizModalOpen = signal<boolean>(false);
  isGeneratingQuiz = signal<boolean>(false);
  availableQuizzes = signal<any[]>([]);
  isQuizActive = computed<boolean>(() => {
    const state = this.socketService.quizState();
    return (
      this.isGroup() &&
      (this.isQuizModalOpen() || (!!this.socketService.activeQuiz() && state !== 'not_started'))
    );
  });

  // Stati UI
  isPlaying = signal<boolean>(false);
  showSubtitles = signal<boolean>(true);
  isSettingsOpen = signal<boolean>(false);
  isMapOpen = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  isChatCollapsed = signal<boolean>(true);

  // contesto
  museumId = signal<string>('');
  visitId = signal<string>('');
  currentMuseum = signal<MuseumResponse | null>(null);

  // Visite di gruppo
  sessionCode = signal<string | null>(null);
  isGroup = signal<boolean>(false);
  isTeacher = signal<boolean>(false);
  audioSummary = computed(() => this.socketService.studentsAudioSummary());
  isLastStep = computed(
    () =>
      this.itinerary().length > 0 &&
      this.currentItineraryStepIndex() >= this.itinerary().length - 1,
  );

  //Setting
  currentSettings = signal<UserNavigatorSettings>({
    tone: 'adulto',
    language: getActiveLanguage(),
    duration: 30,
  });

  // Chat e Dettatura
  messages = signal<ChatMessage[]>([
    { sender: 'ai', text: 'Benvenuto! Sono la tua guida virtuale. Come posso aiutarti oggi?' },
  ]);
  isDictating = signal<boolean>(false);

  // Audio recording e playback
  private isDestroyed = false;
  private commandAbortController: AbortController | null = null;
  private playPromise: Promise<void> | null = null;
  private wasPlayingBeforeMap = false;
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
    this.loadMuseumData(this.museumId());

    // Interrompe immediatamente audio e fetch in-flight se l'utente cambia rotta / sezione
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.cleanupAndStopAll();
      });

    const activeLang = getActiveLanguage();
    const saved = localStorage.getItem(settingsKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      this.currentSettings.update((current) => ({ ...current, ...parsed })); //così se i dati non sono completi si completano
    }
    if (activeLang) {
      this.currentSettings.update((current) => ({ ...current, language: activeLang }));
    }

    effect(() => {
      localStorage.setItem(settingsKey, JSON.stringify(this.currentSettings()));
    });

    effect(() => {
      if (this.isQuizModalOpen()) {
        this.stopAudio();
        this.isGroupChatOpen.set(false);
      }
    });

    effect(() => {
      const active = this.socketService.activeQuiz();
      const state = this.socketService.quizState();
      if (this.isGroup() && active && (state === 'in_progress' || state === 'completed')) {
        this.isQuizModalOpen.set(true);
      }
    });

    let prevGroupMessagesLength = 0;
    effect(() => {
      const currentMsgs = this.socketService.groupMessages();
      if (!this.isGroupChatOpen() && currentMsgs.length > prevGroupMessagesLength) {
        this.unreadGroupMessagesCount.update(
          (c) => c + (currentMsgs.length - prevGroupMessagesLength),
        );
      }
      prevGroupMessagesLength = currentMsgs.length;
    });

    toObservable(this.currentSettings)
      .pipe(
        takeUntilDestroyed(), // Chiude il tubo se il componente viene distrutto
        skip(1), // Opzionale: evita di fare la chiamata API al primo caricamento della pagina (quando legge dal localStorage)
        debounceTime(400), // Aspetta mezzo secondo di inattività
      )
      .subscribe(() => {
        if (!this.isVoiceUpdatingSettings) {
          this.executeCommand({ itemAction: 'EXPLAIN_ITEM' });
        }
      });

    this.activeVisitService.stepJumpRequested$.pipe(takeUntilDestroyed()).subscribe((stepIndex) => {
      this.changeItineraryStep(stepIndex);
    });

    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe((params) => {
      let initialStep = 0;
      if (params['openSettings'] === 'true' || params['openSettings'] === true) {
        this.isSettingsOpen.set(true);
      }
      if (params['step'] !== undefined && params['step'] !== null) {
        const parsed = parseInt(params['step'], 10);
        if (!isNaN(parsed) && parsed >= 0) {
          initialStep = parsed;
        }
      }
      if (
        params['museumId'] &&
        typeof params['museumId'] === 'string' &&
        params['museumId'].length === 24
      ) {
        this.museumId.set(params['museumId']);
        this.loadMuseumData(params['museumId']);
      }
      const vId = params['visitId'];
      const artworkId = params['artworkId'];
      const isVirtual =
        (vId && vId.startsWith('virtual_')) ||
        (this.activeVisitService.isSingleArtworkMode() && artworkId);

      if (isVirtual || artworkId) {
        const targetArtId = artworkId || this.activeVisitService.activeItinerary()[0]?.id;
        this.loadSingleArtworkVisit(targetArtId, vId);
      } else if (vId) {
        this.visitId.set(vId);
        this.loadVisitData(vId, initialStep);
      } else {
        this.currentItineraryStepIndex.set(initialStep);
        this.activeVisitService.setActiveVisit(
          this.visitId(),
          this.museumId(),
          this.itinerary(),
          initialStep,
        );
        this.executeCommand({ itemAction: 'EXPLAIN_ITEM', currentArtworkIndex: initialStep });
      }
      if (params['sessionCode']) {
        const code = params['sessionCode'].toUpperCase().trim();
        this.sessionCode.set(code);
        this.isGroup.set(true);

        // Di base nessun utente è docente al comando finché la titolarità della sessione non è accertata
        this.isTeacher.set(false);

        // Verifica server-side dell'autorità: solo l'utente il cui ID corrisponde a session.teacher è docente al comando
        this.groupService.getSessionByCode(code).subscribe({
          next: (res) => {
            const sessionData = res.data || res;
            const user: any = this.authService.currentUser();
            const myId = (user?.userId || user?.id || user?._id)?.toString();
            const teacher = sessionData?.teacher;
            const teacherId = (teacher?.id || teacher?._id || teacher)?.toString();
            const isOwnerTeacher = Boolean(myId && teacherId && myId === teacherId);
            this.isTeacher.set(isOwnerTeacher);

            if (!isOwnerTeacher) {
              // Notifica subito lo stato di presenza/ascolto al docente
              const currentStatus = this.isPlaying() ? 'listening' : 'not_started';
              this.socketService.sendAudioStatus(
                code,
                this.currentItineraryStepIndex(),
                currentStatus,
              );

              if (this.messages().length === 0) {
                this.messages.set([
                  {
                    sender: 'ai',
                    text: "Benvenuto alla visita di gruppo! La navigazione è sincronizzata e guidata dal tuo docente. Puoi ascoltare la guida, approfondire l'opera corrente o chiedere informazioni sui servizi del museo.",
                  },
                ]);
              }
            }
          },
          error: (err) => {
            console.warn(
              '[Navigator] Impossibile verificare titolarità sessione o accesso negato:',
              err,
            );
            this.isTeacher.set(false);
            if (err.status === 400 || err.status === 404 || err.status === 403) {
              const msg =
                err.error?.message || 'Accesso non consentito a questa sessione di gruppo.';
              window.alert(msg);
              this.socketService.disconnect();
              this.router.navigate(['/groups']);
            }
          },
        });

        // Connetti WebSocket se non già connesso
        this.socketService.connect(code);

        // Se lo studente riceve il cambio tappa dal docente, si sincronizza automaticamente
        this.socketService.onStepChanged((data) => {
          if (!this.isTeacher() && typeof data?.stepIndex === 'number') {
            console.log('[Navigator] Step sincronizzato dal docente:', data.stepIndex);
            this.stopAudio();

            this.currentItineraryStepIndex.set(data.stepIndex);
            this.itemIsArtwork.set(true);

            // Notifica subito al docente che lo studente/partecipante è sulla nuova tappa (not_started)
            this.socketService.sendAudioStatus(code, data.stepIndex, 'not_started');

            this.executeCommand({
              itemAction: 'EXPLAIN_ITEM',
              currentArtworkIndex: data.stepIndex,
            });
          }
        });

        // Se la sessione viene conclusa dal docente
        this.socketService.onSessionEnded((data: any) => {
          this.isQuizModalOpen.set(false);
          this.stopAudio();
          this.socketService.disconnect();
          this.router.navigate(['/']);
        });

        // Ricezione avvio quiz finale per tutti i partecipanti
        this.socketService.onQuizStarted((data) => {
          console.log('[Navigator] Quiz finale avviato:', data);
          this.isQuizModalOpen.set(true);
        });

        this.socketService.onQuizEnded((data) => {
          console.log('[Navigator] Quiz finale concluso:', data);
          this.isQuizModalOpen.set(true);
        });
      } else {
        this.sessionCode.set(null);
        this.isGroup.set(false);
        this.isTeacher.set(false);
        this.isQuizModalOpen.set(false);
        this.socketService.disconnect();
      }
    });
  }

  private loadMuseumData(mId: string): void {
    if (!mId || typeof mId !== 'string' || mId.length !== 24) return;
    this.museumService
      .getById(mId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          if (data) {
            this.currentMuseum.set(data);
          }
        },
        error: () => {},
      });
  }

  private loadVisitData(vId: string, initialStep: number = 0): void {
    this.quizService
      .getQuizzesByVisit(vId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.availableQuizzes.set(res.data || []),
        error: () => {},
      });

    this.messages.set([
      {
        sender: 'ai',
        text: 'Benvenuto! Sono la tua guida virtuale per questa visita. Come posso aiutarti?',
      },
    ]);
    this.itemIsArtwork.set(true);
    this.currentItineraryStepIndex.set(initialStep);
    this.stopAudio();

    this.visitService
      .getById(vId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (visitData: any) => {
          let loadedArtworks = DUMMY_ITINERARY_ARTWORKS;
          const rawSteps = visitData?.steps || visitData?.visits || [];
          if (rawSteps && rawSteps.length > 0) {
            loadedArtworks = rawSteps.map((v: any, index: number) => {
              const art = v.artwork && typeof v.artwork === 'object' ? v.artwork : null;
              return {
                id: art?._id || art?.id || v.artworkId || `art-${index}`,
                title:
                  art?.title ||
                  v.artworkTitle ||
                  (typeof v.artwork === 'string' ? v.artwork : `Tappa ${index + 1}`),
                description: art?.description || '',
                startYear: art?.startYear || 0,
                endYear: art?.endYear || 0,
                artists: art?.artists || [],
                museum: art?.museum || ({} as any),
                location: art?.location || {
                  room: `Sala ${index + 1}`,
                  floor: 'Piano Terra',
                  build: 'Ala Principale',
                },
                dimensions: art?.dimensions || { height: 0, width: 0, depth: 0, unit: 'cm' },
                artisticCurrents: art?.artisticCurrents || [],
                details: art?.details || {
                  subjects: [],
                  colors: [],
                  places: [],
                  objectType: 'Opera',
                  materials: [],
                  technique: [],
                },
                copyOf: null as any,
                falsificationOf: null as any,
                isActive: true,
                isPrivate: false,
                qrCode: art?.qrCode || `QR-${index + 1}`,
                assets: art?.assets || {
                  images: [{ url: '/assets/images/place_holder.jpg', orientation: 'landscape' }],
                },
              };
            });
            this.itinerary.set(loadedArtworks);
          }
          if (visitData?.museum) {
            this.currentMuseum.set(visitData.museum);
          }
          if (
            visitData?.museumId &&
            typeof visitData.museumId === 'string' &&
            visitData.museumId.length === 24
          ) {
            this.museumId.set(visitData.museumId);
            if (!visitData?.museum) {
              this.loadMuseumData(visitData.museumId);
            }
          }
          const validStep =
            initialStep >= 0 && initialStep < loadedArtworks.length ? initialStep : 0;
          this.activeVisitService.setActiveVisit(vId, this.museumId(), loadedArtworks, validStep);
          this.currentItineraryStepIndex.set(validStep);
          this.executeCommand({ itemAction: 'EXPLAIN_ITEM', currentArtworkIndex: validStep });
        },
        error: (err) => {
          console.warn('Caricamento dati visita non riuscito, uso itinerario di fallback:', err);
          const validStep =
            initialStep >= 0 && initialStep < DUMMY_ITINERARY_ARTWORKS.length ? initialStep : 0;
          this.activeVisitService.setActiveVisit(
            vId,
            this.museumId(),
            DUMMY_ITINERARY_ARTWORKS,
            validStep,
          );
          this.currentItineraryStepIndex.set(validStep);
          this.executeCommand({ itemAction: 'EXPLAIN_ITEM', currentArtworkIndex: validStep });
        },
      });
  }

  private loadSingleArtworkVisit(artworkId?: string, visitIdParam?: string): void {
    this.stopAudio();
    this.itemIsArtwork.set(true);
    this.currentItineraryStepIndex.set(0);

    this.messages.set([
      {
        sender: 'ai',
        text: "Benvenuto! Sono la tua guida virtuale per quest'opera. Come posso aiutarti?",
      },
    ]);

    const virtualId = visitIdParam || `virtual_single_${artworkId || 'artwork'}`;
    this.visitId.set(virtualId);

    // 1. Verifichiamo se l'opera è già registrata nell'ActiveVisitService (sessionStorage) con immagine valida reale
    const cachedItinerary = this.activeVisitService.activeItinerary();
    const firstArt = cachedItinerary[0];
    const cachedImageUrl = firstArt?.assets?.images?.[0]?.url;
    const hasRealCachedImage = Boolean(
      cachedImageUrl && !cachedImageUrl.includes('place_holder.jpg'),
    );
    const isMatchingCached =
      cachedItinerary.length === 1 &&
      (!artworkId || firstArt.id === artworkId || (firstArt as any)._id === artworkId) &&
      hasRealCachedImage;

    if (isMatchingCached) {
      const artwork = cachedItinerary[0];
      this.itinerary.set([artwork]);
      const artId = artwork.id || (artwork as any)._id;
      const mId =
        typeof artwork.museum === 'object' && artwork.museum !== null
          ? (artwork.museum as any)._id || (artwork.museum as any).id || ''
          : typeof artwork.museum === 'string'
            ? artwork.museum
            : '';
      if (mId) {
        this.museumId.set(mId);
        this.loadMuseumData(mId);
      }
      this.executeCommand({
        itemAction: 'EXPLAIN_ITEM',
        currentArtworkIndex: 0,
        artworkId: artId,
      });
      return;
    }

    // 2. Se non presente in cache o ricaricata da URL esterno, carichiamo via ArtworkService
    if (artworkId) {
      this.artworkService
        .getById(artworkId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (artwork: any) => {
            if (artwork) {
              const rawImages = artwork.assets?.images || (artwork as any).images || [];
              const formattedImages =
                rawImages.length > 0
                  ? rawImages
                  : (artwork as any).imageUrl
                    ? [{ url: (artwork as any).imageUrl, orientation: 'landscape' }]
                    : [];

              const formattedArtwork: ArtworkResponse = {
                id: artwork.id || artwork._id || artworkId,
                title: artwork.title || 'Opera',
                description: artwork.description || '',
                startYear: artwork.startYear || 0,
                endYear: artwork.endYear || 0,
                artists: artwork.artists || [],
                museum: artwork.museum || ({} as any),
                location: artwork.location || {
                  room: 'Sala Principale',
                  floor: 'Piano Terra',
                  build: 'Museo',
                },
                dimensions: artwork.dimensions || { height: 0, width: 0, depth: 0, unit: 'cm' },
                artisticCurrents: artwork.artisticCurrents || [],
                details: artwork.details || {
                  subjects: [],
                  colors: [],
                  places: [],
                  objectType: 'Opera',
                  materials: [],
                  technique: [],
                },
                copyOf: null as any,
                falsificationOf: null as any,
                isActive: artwork.isActive ?? true,
                isPrivate: artwork.isPrivate ?? false,
                qrCode: artwork.qrCode || `QR-${artworkId}`,
                assets:
                  formattedImages.length > 0
                    ? { images: formattedImages }
                    : {
                        images: [
                          { url: '/assets/images/place_holder.jpg', orientation: 'landscape' },
                        ],
                      },
              };
              this.activeVisitService.setVirtualSingleArtworkVisit(formattedArtwork);
              this.itinerary.set([formattedArtwork]);
              const artId = formattedArtwork.id;
              const mId =
                typeof formattedArtwork.museum === 'object' && formattedArtwork.museum !== null
                  ? (formattedArtwork.museum as any)._id ||
                    (formattedArtwork.museum as any).id ||
                    ''
                  : typeof formattedArtwork.museum === 'string'
                    ? formattedArtwork.museum
                    : '';
              if (mId) {
                this.museumId.set(mId);
                this.loadMuseumData(mId);
              }
              this.executeCommand({
                itemAction: 'EXPLAIN_ITEM',
                currentArtworkIndex: 0,
                artworkId: artId,
              });
            }
          },
          error: (err) => {
            console.warn('Recupero opera singola fallito, fallback su dummy:', err);
            const fallback =
              DUMMY_ITINERARY_ARTWORKS.find(
                (a) =>
                  a.id === artworkId ||
                  a.qrCode === artworkId ||
                  a.title.toLowerCase().includes(artworkId?.toLowerCase() || ''),
              ) || DUMMY_ITINERARY_ARTWORKS[0];
            this.activeVisitService.setVirtualSingleArtworkVisit(fallback);
            this.itinerary.set([fallback]);
            this.executeCommand({
              itemAction: 'EXPLAIN_ITEM',
              currentArtworkIndex: 0,
              artworkId: fallback.id,
            });
          },
        });
    }
  }

  // Sottotitoli
  currentSubtitle = signal<string>('Nel dipinto possiamo notare i dettagli delle vesti dorate...');

  // Itinerario
  currentItineraryStepIndex = signal<number>(0);
  itinerary = signal<ArtworkResponse[]>(DUMMY_ITINERARY_ARTWORKS);

  // Gestione tipologia item (Opera vs Artista)
  itemIsArtwork = signal<boolean>(true);

  currentArtwork = computed<ArtworkResponse | null>(() => {
    const list = this.itinerary();
    const idx = this.currentItineraryStepIndex();
    return list[idx] || list[0] || null;
  });

  currentArtist = computed<ArtistResponse | null>(() => {
    const artwork = this.currentArtwork();
    if (artwork && artwork.artists && artwork.artists.length > 0) {
      const firstArtist = artwork.artists[0];
      return typeof firstArtist === 'object' && firstArtist !== null
        ? (firstArtist as ArtistResponse)
        : null;
    }
    return null;
  });

  currentArtworkName = computed<string>(() => {
    const artwork = this.currentArtwork();
    return artwork?.title || 'OPERA';
  });

  currentArtistName = computed<string>(() => {
    const artist = this.currentArtist();
    return `${artist?.name || ''} ${artist?.surname || ''}`.trim() || 'AUTORE';
  });

  displayImageUrl = computed<string>(() => {
    if (this.itemIsArtwork()) {
      const art = this.currentArtwork();
      return (
        art?.assets?.images?.[0]?.url ||
        (art as any)?.images?.[0]?.url ||
        (art as any)?.imageUrl ||
        '/assets/images/place_holder.jpg'
      );
    }
    const artist = this.currentArtist();
    return (
      artist?.assets?.images?.[0]?.url ||
      (artist as any)?.images?.[0]?.url ||
      (artist as any)?.imageUrl ||
      '/assets/images/place_holder.jpg'
    );
  });

  displayImageAlt = computed<string>(() => {
    if (this.itemIsArtwork()) {
      return this.currentArtwork()?.title || "Dettaglio opera d'arte";
    }
    const artist = this.currentArtist();
    if (artist) {
      return `${artist.name || ''} ${artist.surname || ''}`.trim() || 'Foto autore';
    }
    return 'Foto autore';
  });

  private lastAudioUrl: string | null = null;

  private cleanupAndStopAll(): void {
    this.isDestroyed = true;
    if (this.commandAbortController) {
      this.commandAbortController.abort();
      this.commandAbortController = null;
    }
    this.stopAudio();
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {}
    }
  }

  stopAudio(): void {
    this.isPlaying.set(false);
    this.audioCurrentTime.set(0);
    this.audioDuration.set(0);

    if (this.currentAudio) {
      const audio = this.currentAudio;
      this.currentAudio = null;

      audio.ontimeupdate = null;
      audio.onloadedmetadata = null;
      audio.onended = null;
      audio.onpause = null;
      audio.onplay = null;
      audio.onerror = null;

      if (this.playPromise) {
        this.playPromise
          .then(() => {
            try {
              audio.pause();
              audio.currentTime = 0;
              audio.removeAttribute('src');
              audio.load();
            } catch (e) {}
          })
          .catch(() => {
            try {
              audio.removeAttribute('src');
              audio.load();
            } catch (e) {}
          });
        this.playPromise = null;
      } else {
        try {
          audio.pause();
          audio.currentTime = 0;
          audio.removeAttribute('src');
          audio.load();
        } catch (e) {}
      }
    }
  }

  private pauseAudio(): void {
    this.isPlaying.set(false);
    if (this.currentAudio) {
      if (this.playPromise) {
        this.playPromise
          .then(() => {
            if (!this.isPlaying()) {
              this.currentAudio?.pause();
            }
          })
          .catch(() => {});
      } else {
        this.currentAudio.pause();
      }
    }
    if (this.isGroup() && !this.isTeacher() && this.sessionCode()) {
      this.socketService.sendAudioStatus(
        this.sessionCode()!,
        this.currentItineraryStepIndex(),
        'paused',
      );
    }
  }

  startAudio(): void {
    if (this.isDestroyed || this.isLoading()) return;

    if (!this.currentAudio && this.lastAudioUrl) {
      this.initAudioElement(this.lastAudioUrl);
    }

    const audio = this.currentAudio;
    if (!audio) return;

    const savedTime = this.audioCurrentTime();
    const dur = this.audioDuration();
    if (savedTime > 0 && (!dur || savedTime < dur - 0.5)) {
      try {
        audio.currentTime = savedTime;
      } catch (e) {}
    }

    this.isPlaying.set(true);
    this.playPromise = audio.play();
    this.playPromise
      .then(() => {
        this.playPromise = null;
        if (this.isDestroyed || this.currentAudio !== audio) {
          try {
            audio.pause();
          } catch (e) {}
          return;
        }
        this.isPlaying.set(true);
        if (this.isGroup() && !this.isTeacher() && this.sessionCode()) {
          this.socketService.sendAudioStatus(
            this.sessionCode()!,
            this.currentItineraryStepIndex(),
            'listening',
          );
        }
      })
      .catch((err) => {
        this.playPromise = null;
        if (err.name !== 'AbortError') {
          console.warn('Playback audio non consentito dal browser o interrotto:', err);
        }
        if (this.currentAudio === audio) {
          this.isPlaying.set(false);
        }
      });
  }

  ngOnDestroy(): void {
    this.cleanupAndStopAll();
  }

  async executeCommand(
    extraParams: Partial<NavigatorRequest> = {},
    audioBlob?: Blob,
  ): Promise<void> {
    if (this.isDestroyed) return;

    // Cancella eventuale richiesta e audio precedente in corso
    if (this.commandAbortController) {
      this.commandAbortController.abort();
      this.commandAbortController = null;
    }
    this.stopAudio();

    const abortController = new AbortController();
    this.commandAbortController = abortController;

    const settings = this.currentSettings();

    // Se è uno studente in visita di gruppo, rimane forzatamente ancorato alla tappa sincronizzata dal docente
    if (this.isGroup() && !this.isTeacher()) {
      extraParams.currentArtworkIndex = this.currentItineraryStepIndex();
    }

    const curArt = this.currentArtwork();
    const isSingleMode =
      this.activeVisitService.isSingleArtworkMode() ||
      (this.visitId()?.startsWith('virtual_') ?? false) ||
      !!extraParams.artworkId;
    const singleArtId = isSingleMode && curArt ? curArt.id || (curArt as any)._id : undefined;
    const effectiveArtworkId = extraParams.artworkId || singleArtId;

    const request: NavigatorRequest = {
      museumId: this.museumId() || undefined,
      visitId: isSingleMode ? undefined : this.visitId() || undefined,
      artworkId: effectiveArtworkId,
      currentArtworkIndex: this.currentItineraryStepIndex(),
      language: settings.language,
      tone: settings.tone,
      length: settings.duration,
      isGroup: this.isGroup(),
      isTeacher: this.isTeacher(),
      sessionCode: this.sessionCode() || undefined,
      ...extraParams,
    };

    if (isSingleMode) {
      delete request.visitId;
    }

    this.isLoading.set(true);

    try {
      await this.navigatorService.sendCommand(
        request,
        audioBlob,
        (chunk: StreamChunk) => {
          if (this.isDestroyed || abortController.signal.aborted) return;

          if (chunk.type === 'TRANSCRIPTION' && chunk.text) {
            this.messages.update((msgs) => {
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
            const reply =
              chunk.data?.reply || chunk.data?.text || chunk.text || 'Risposta ricevuta.';
            this.messages.update((msgs) => [...msgs, { sender: 'ai', text: reply }]);
            this.currentSubtitle.set(reply);

            // Aggiorna l'indice dell'opera se il comando ha navigato verso un'altra opera
            let targetIndex: number | null = null;
            if (
              chunk.data?.currentArtworkIndex !== undefined &&
              chunk.data?.currentArtworkIndex !== null
            ) {
              targetIndex = Number(chunk.data.currentArtworkIndex);
            } else if (chunk.data?.itemAction === 'NEXT_ITEM') {
              targetIndex = this.currentItineraryStepIndex() + 1;
            } else if (chunk.data?.itemAction === 'PREVIOUS_ITEM') {
              targetIndex = this.currentItineraryStepIndex() - 1;
            }

            if (
              targetIndex !== null &&
              !isNaN(targetIndex) &&
              targetIndex >= 0 &&
              targetIndex < this.itinerary().length
            ) {
              if (targetIndex !== this.currentItineraryStepIndex()) {
                this.currentItineraryStepIndex.set(targetIndex);
                this.itemIsArtwork.set(true);
                if (this.isGroup() && this.isTeacher() && this.sessionCode()) {
                  this.socketService
                    .changeStep(this.sessionCode()!, '', targetIndex)
                    .catch((err) => {
                      console.warn('Errore broadcast step change da comando vocale:', err);
                    });
                }
              }
            }

            // Aggiorna lo stato opera vs artista se indicato dalla risposta o dai parametri
            if (chunk.data?.targetArtist || extraParams.targetArtist) {
              this.itemIsArtwork.set(false);
            } else if (
              chunk.data?.itemAction ||
              extraParams.itemAction ||
              targetIndex !== null ||
              chunk.data?.targetArtwork ||
              chunk.data?.artwork
            ) {
              this.itemIsArtwork.set(true);
            }

            // Aggiorna l'opera d'arte e le sue immagini se ricevute dal flusso del navigator
            if (chunk.data?.artwork) {
              const returnedArtwork = chunk.data.artwork;
              this.itinerary.update((currentList) => {
                if (!currentList || currentList.length === 0) return [returnedArtwork];
                const idx = this.currentItineraryStepIndex();
                const existing = currentList[idx] || currentList[0];
                const returnedImages = returnedArtwork.assets?.images || [];
                const hasNewImages =
                  returnedImages.length > 0 && !returnedImages[0].url.includes('place_holder.jpg');
                const merged: ArtworkResponse = {
                  ...existing,
                  ...returnedArtwork,
                  assets: hasNewImages ? returnedArtwork.assets : existing.assets,
                };
                const copy = [...currentList];
                copy[idx] = merged;
                return copy;
              });
              if (this.activeVisitService.isSingleArtworkMode() && this.itinerary().length > 0) {
                this.activeVisitService.setVirtualSingleArtworkVisit(this.itinerary()[0]);
              }
            }

            // Aggiorna eventuali impostazioni modificate a voce
            if (chunk.data?.tone || chunk.data?.language || chunk.data?.length) {
              this.isVoiceUpdatingSettings = true;
              this.currentSettings.update((curr) => {
                const updated = { ...curr };
                if (chunk.data?.language) updated.language = chunk.data.language;
                if (chunk.data?.tone) {
                  const t = chunk.data.tone;
                  if (t === 'infantile') updated.tone = 'bambino';
                  else if (t === 'simple') updated.tone = 'studente';
                  else if (t === 'medium') updated.tone = 'adulto';
                  else if (t === 'technical' || t === 'thecnical') updated.tone = 'specialista';
                  else if (['bambino', 'studente', 'adulto', 'specialista'].includes(t))
                    updated.tone = t as any;
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
              if (!this.isDestroyed && !abortController.signal.aborted) {
                this.playAudioSource(audioData);
              }
            }
          } else if (chunk.type === 'ERROR') {
            this.isLoading.set(false);
            const errMsg = chunk.error || 'Errore durante la comunicazione con il server.';
            this.messages.update((msgs) => [...msgs, { sender: 'ai', text: errMsg }]);
          }
        },
        abortController.signal,
      );
    } catch (err: any) {
      if (err?.name === 'AbortError' || abortController.signal.aborted) {
        return;
      }
      this.isLoading.set(false);
      const errMsg = err?.message || 'Errore di connessione con il navigatore.';
      this.messages.update((msgs) => [...msgs, { sender: 'ai', text: errMsg }]);
    } finally {
      if (this.commandAbortController === abortController) {
        this.commandAbortController = null;
        this.isLoading.set(false);
      }
    }
  }

  togglePlay(): void {
    if (this.isLoading()) return;

    if (this.isPlaying()) {
      this.pauseAudio();
    } else {
      this.startAudio();
    }
  }

  formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  seekAudio(event: MouseEvent): void {
    if (this.isLoading()) return;
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
        try {
          this.currentAudio.currentTime = newTime;
        } catch (e) {}
        this.audioCurrentTime.set(newTime);
      }
    }
  }

  private initAudioElement(src: string): void {
    this.stopAudio();
    const audio = new Audio(src);
    this.currentAudio = audio;

    audio.ontimeupdate = () => {
      if (this.currentAudio === audio) {
        this.audioCurrentTime.set(audio.currentTime);
      }
    };
    audio.onloadedmetadata = () => {
      if (this.currentAudio === audio) {
        this.audioDuration.set(audio.duration || 0);
      }
    };
    audio.onended = () => {
      if (this.currentAudio === audio) {
        this.isPlaying.set(false);
        this.audioCurrentTime.set(0);
        if (this.isGroup() && !this.isTeacher() && this.sessionCode()) {
          this.socketService.sendAudioStatus(
            this.sessionCode()!,
            this.currentItineraryStepIndex(),
            'completed',
          );
        }
      }
    };
    audio.onpause = () => {
      if (
        this.currentAudio === audio &&
        this.isGroup() &&
        !this.isTeacher() &&
        this.sessionCode()
      ) {
        const dur = this.audioDuration();
        const cur = this.audioCurrentTime();
        if (cur > 0 && cur < dur - 0.5) {
          this.socketService.sendAudioStatus(
            this.sessionCode()!,
            this.currentItineraryStepIndex(),
            'paused',
          );
        }
      }
    };
    audio.onplay = () => {
      if (
        this.currentAudio === audio &&
        this.isGroup() &&
        !this.isTeacher() &&
        this.sessionCode()
      ) {
        this.socketService.sendAudioStatus(
          this.sessionCode()!,
          this.currentItineraryStepIndex(),
          'listening',
        );
      }
    };
    audio.onerror = () => {
      if (this.currentAudio === audio) {
        this.isPlaying.set(false);
      }
    };
  }

  private playAudioSource(src: string): void {
    if (this.isDestroyed) return;
    this.initAudioElement(src);
    if (this.currentAudio) {
      const audio = this.currentAudio;
      this.isPlaying.set(true);
      this.playPromise = audio.play();
      this.playPromise
        .then(() => {
          this.playPromise = null;
          if (this.isDestroyed || this.currentAudio !== audio) {
            try {
              audio.pause();
            } catch (e) {}
            return;
          }
          this.isPlaying.set(true);
          if (this.isGroup() && !this.isTeacher() && this.sessionCode()) {
            this.socketService.sendAudioStatus(
              this.sessionCode()!,
              this.currentItineraryStepIndex(),
              'listening',
            );
          }
        })
        .catch((err) => {
          this.playPromise = null;
          if (err.name !== 'AbortError') {
            console.warn('Playback audio non consentito dal browser o interrotto:', err);
          }
          if (this.currentAudio === audio) {
            this.isPlaying.set(false);
          }
        });
    }
  }

  toggleSubtitles(): void {
    this.showSubtitles.update((v) => !v);
    //TODO subtitles
  }

  async toggleDictation(): Promise<void> {
    this.stopAudio();
    if (!this.isDictating()) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.stopAudio();
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(this.audioChunks, {
            type: this.mediaRecorder?.mimeType || 'audio/webm',
          });
          stream.getTracks().forEach((track) => track.stop());
          this.messages.update((msgs) => [
            ...msgs,
            { sender: 'user', text: '🎤 [Elaborazione audio...]', type: 'audio' },
          ]);
          this.executeCommand({}, audioBlob);
        };

        this.mediaRecorder.start();
        this.isDictating.update((v) => !v);
      } catch (err) {
        console.error('Impossibile accedere al microfono:', err);
      }
    } else {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      this.isDictating.update((v) => !v);
    }
  }

  openSettings(): void {
    this.isSettingsOpen.set(true);
  }

  openMap(): void {
    this.wasPlayingBeforeMap = this.isPlaying();
    this.pauseAudio();
    this.isMapOpen.set(true);
  }

  closeMap(): void {
    this.isMapOpen.set(false);
    if (this.wasPlayingBeforeMap) {
      this.startAudio();
    }
  }

  tellMeMore(): void {
    if (this.isLoading()) return;
    console.log("Richiesta maggiori informazioni sull'opera...");
    this.stopAudio();
    this.itemIsArtwork.set(true);
    this.messages.update((msgs) => [
      ...msgs,
      { sender: 'user', text: "Dimmi di più sull'opera corrente.", type: 'text' },
    ]);
    this.executeCommand({ itemAction: 'TELL_ME_MORE' });
  }

  askAuthor(): void {
    if (this.isLoading()) return;
    console.log("Richiesta informazioni sull'autore dell'opera...");
    this.stopAudio();
    this.itemIsArtwork.set(false);
    this.messages.update((msgs) => [
      ...msgs,
      { sender: 'user', text: "Parlami dell'autore di quest'opera.", type: 'text' },
    ]);
    this.executeCommand({ targetArtist: 'CURRENT_AUTHOR' });
  }

  askPoi(poiType: string, label: string): void {
    if (this.isLoading()) return;
    this.messages.update((msgs) => [
      ...msgs,
      { sender: 'user', text: `Dove si trova: ${label}?`, type: 'text' },
    ]);
    this.stopAudio();
    this.executeCommand({ targetPoiType: poiType });
  }

  scrollToItinerary(): void {
    const el = document.getElementById('itinerary');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  changeItineraryStep(index: number): void {
    this.stopAudio();
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
        const msg =
          notDone === 1
            ? `Attenzione: 1 studente non ha ancora completato l'ascolto di questa tappa.\n\nVuoi procedere comunque per tutto il gruppo?`
            : `Attenzione: ${notDone} studenti non hanno ancora completato l'ascolto di questa tappa.\n\nVuoi procedere comunque per tutto il gruppo?`;
        const proceed = window.confirm(msg);
        if (!proceed) {
          return;
        }
      }
    }

    this.itemIsArtwork.set(true);
    this.currentItineraryStepIndex.set(index);
    this.activeVisitService.updateCurrentStep(index);
    this.executeCommand({ itemAction: 'EXPLAIN_ITEM', currentArtworkIndex: index });

    // Se è il docente in una visita di gruppo, sincronizza tutti gli studenti
    if (this.isGroup() && this.isTeacher() && this.sessionCode()) {
      this.socketService.changeStep(this.sessionCode()!, '', index).catch((err) => {
        console.warn('Errore broadcast step change:', err);
      });
    }
  }

  nextArtwork(): void {
    if (this.isLoading()) return;
    this.stopAudio();
    if (this.isGroup() && !this.isTeacher()) return;
    const nextIdx = this.currentItineraryStepIndex() + 1;
    if (nextIdx < this.itinerary().length) {
      this.changeItineraryStep(nextIdx);
    }
  }

  prevArtwork(): void {
    if (this.isLoading()) return;
    this.stopAudio();
    if (this.isGroup() && !this.isTeacher()) return;
    const prevIdx = this.currentItineraryStepIndex() - 1;
    if (prevIdx >= 0) {
      this.changeItineraryStep(prevIdx);
    }
  }

  async startGroupQuiz(): Promise<void> {
    this.stopAudio();
    const code = this.sessionCode();
    const vId = this.visitId();
    if (!code) return;

    const confirmed = window.confirm(
      'Attenzione: avviando il quiz finale concluderai la navigazione della visita guidata e non sarà più possibile tornare indietro tra le tappe. Vuoi procedere?',
    );
    if (!confirmed) return;

    this.isGeneratingQuiz.set(true);

    try {
      let quizzes = this.availableQuizzes();
      let quizId = quizzes.length > 0 ? quizzes[0]._id || quizzes[0].id : null;

      if (!quizId && vId) {
        const genRes = await firstValueFrom(
          this.quizService.generateQuiz({
            visitId: vId,
            numberOfQuestions: 5,
            difficulty: 'medium',
            targetAge: 'studente',
            language: this.currentSettings().language || 'it',
          }),
        );
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

  endVisit(): void {
    const confirmMsg = this.activeVisitService.isSingleArtworkMode()
      ? "Terminando l'esplorazione uscirai dal navigatore. Sei sicuro?"
      : 'Terminando la visita perderai tutti i progressi. Sei sicuro?';
    if (!window.confirm(confirmMsg)) {
      return;
    }
    this.stopAudio();

    this.isQuizModalOpen.set(false);
    this.activeVisitService.clearActiveVisit();
    this.socketService.disconnect();
    this.router.navigate(['/marketplace']);
  }

  endGroupVisit(): void {
    const isTeacher = this.isTeacher();
    const confirmMessage = isTeacher
      ? 'Sei sicuro di voler terminare la visita di gruppo per tutta la classe?'
      : 'Sei sicuro di voler uscire dalla visita di gruppo?';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    const code = this.sessionCode();
    this.stopAudio();

    this.isQuizModalOpen.set(false);
    this.activeVisitService.clearActiveVisit();

    if (code) {
      if (isTeacher) {
        this.socketService.endSession(code, '').finally(() => {
          this.socketService.disconnect();
          this.router.navigate(['/']);
        });
      } else {
        this.socketService.leaveRoom(code);
        this.router.navigate(['/']);
      }
    } else {
      this.socketService.disconnect();
      this.router.navigate(['/']);
    }
  }

  toggleGroupChat(): void {
    const next = !this.isGroupChatOpen();
    this.isGroupChatOpen.set(next);
    if (next) {
      this.unreadGroupMessagesCount.set(0);
    }
  }

  onSendGroupMessage(text: string): void {
    if (!text || !text.trim()) return;
    const code = this.sessionCode();
    if (code) {
      this.socketService
        .sendGroupMessage(code, text.trim(), this.currentItineraryStepIndex())
        .catch((err: any) => console.error('[Navigator] Errore invio messaggio stanza:', err));
    }
  }

  closeQuizModal(): void {
    this.isQuizModalOpen.set(false);
    this.socketService.resetSessionState();
    this.socketService.disconnect();
  }
}
