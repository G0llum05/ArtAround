import { Component, inject, signal, computed, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SingleArtworkModalService } from '../../services/single-artwork-modal.service';
import { NavigatorService, StreamChunk } from '../../services/navigator.service';
import { NavigatorRequest } from '../../models/navigator.model';
import { ToneType, UserNavigatorSettings } from '../../models/appModel/userNavigatorSettings';
import { ChatMessage } from '../../models/appModel/chatMessage';
import { getActiveLanguage } from '../language-selector/language-selector';

const settingsKey = 'navigatorSettings';

@Component({
  selector: 'app-single-artwork-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './single-artwork-modal.html',
  styleUrl: './single-artwork-modal.css'
})
export class SingleArtworkModal implements OnDestroy {
  protected modalService = inject(SingleArtworkModalService);
  private navigatorService = inject(NavigatorService);
  private router = inject(Router);

  artwork = computed(() => this.modalService.artwork());

  isPlaying = signal<boolean>(false);
  showSubtitles = signal<boolean>(true);
  isLoading = signal<boolean>(false);
  isDictating = signal<boolean>(false);

  currentSubtitle = signal<string>('');
  messages = signal<ChatMessage[]>([]);

  currentSettings = signal<UserNavigatorSettings>({
    tone: 'adulto',
    language: getActiveLanguage(),
    duration: 30
  });

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

  private currentAudio: HTMLAudioElement | null = null;
  private lastAudioUrl: string | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private commandAbortController: AbortController | null = null;
  private playPromise: Promise<void> | null = null;

  constructor() {
    // Chiude il modale e spegne l'audio immediatamente se si naviga ad un'altra pagina
    this.router.events.pipe(
      filter(event => event instanceof NavigationStart),
      takeUntilDestroyed()
    ).subscribe(() => {
      this.close();
    });

    const activeLang = getActiveLanguage();
    const saved = localStorage.getItem(settingsKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.currentSettings.update(curr => ({ ...curr, ...parsed }));
      } catch {}
    }
    if (activeLang) {
      this.currentSettings.update(curr => ({ ...curr, language: activeLang }));
    }

    effect(() => {
      const art = this.artwork();
      if (art && this.modalService.isOpen()) {
        this.resetState();
        this.messages.set([
          { sender: 'ai', text: `Hai inquadrato "${art.title}". Posso descriverti l'opera, parlarti dell'autore o rispondere alle tue domande su questo specifico capolavoro.` }
        ]);
        this.executeCommand({ itemAction: 'EXPLAIN_ITEM' });
      } else if (!this.modalService.isOpen()) {
        this.stopAudio();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopAudio();
  }

  close(): void {
    this.stopAudio();
    this.modalService.close();
  }

  async executeCommand(extraParams: Partial<NavigatorRequest> = {}, audioBlob?: Blob): Promise<void> {
    const art = this.artwork();
    if (!art || !this.modalService.isOpen()) return;

    if (this.commandAbortController) {
      this.commandAbortController.abort();
      this.commandAbortController = null;
    }
    this.stopAudio();

    const abortController = new AbortController();
    this.commandAbortController = abortController;

    const settings = this.currentSettings();
    const artId = (art.id || (art as any)._id || art.qrCode || '').toString();

    const request: NavigatorRequest = {
      artworkId: artId,
      language: settings.language,
      tone: settings.tone,
      length: settings.duration,
      ...extraParams
    };

    this.isLoading.set(true);

    try {
      await this.navigatorService.sendCommand(
        request,
        audioBlob,
        (chunk: StreamChunk) => {
          if (!this.modalService.isOpen() || abortController.signal.aborted) return;

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

            if (chunk.data?.length !== undefined && chunk.data?.length !== null) {
              const l = Number(chunk.data.length);
              if (!isNaN(l)) {
                this.currentSettings.update(curr => ({ ...curr, duration: l }));
              }
            }

            const audioData = chunk.data?.audio;
            if (audioData) {
              this.lastAudioUrl = audioData;
              if (this.modalService.isOpen() && !abortController.signal.aborted) {
                this.playAudioSource(audioData);
              }
            }
          } else if (chunk.type === 'ERROR') {
            this.isLoading.set(false);
            const errMsg = chunk.error || 'Errore durante la comunicazione.';
            this.messages.update(msgs => [...msgs, { sender: 'ai', text: errMsg }]);
          }
        },
        abortController.signal
      );
    } catch (err: any) {
      if (err?.name === 'AbortError' || abortController.signal.aborted) {
        return;
      }
      this.isLoading.set(false);
      const errMsg = err?.message || 'Errore di connessione con il servizio di spiegazione.';
      this.messages.update(msgs => [...msgs, { sender: 'ai', text: errMsg }]);
    } finally {
      if (this.commandAbortController === abortController) {
        this.commandAbortController = null;
        this.isLoading.set(false);
      }
    }
  }

  tellMeMore(): void {
    if (this.isLoading()) return;
    this.messages.update(msgs => [...msgs, { sender: 'user', text: "Dimmi di più su quest'opera.", type: 'text' }]);
    this.executeCommand({ itemAction: 'TELL_ME_MORE' });
  }

  askAuthor(): void {
    if (this.isLoading()) return;
    this.messages.update(msgs => [...msgs, { sender: 'user', text: "Parlami dell'autore di quest'opera.", type: 'text' }]);
    this.executeCommand({ targetArtist: 'CURRENT_AUTHOR' });
  }

  togglePlay(): void {
    if (this.isLoading()) return;

    if (this.isPlaying()) {
      this.isPlaying.set(false);
      if (this.currentAudio) {
        if (this.playPromise) {
          this.playPromise.then(() => {
            if (!this.isPlaying()) {
              this.currentAudio?.pause();
            }
          }).catch(() => {});
        } else {
          this.currentAudio.pause();
        }
      }
    } else {
      if (!this.currentAudio && this.lastAudioUrl) {
        this.initAudioElement(this.lastAudioUrl);
      }
      if (this.currentAudio) {
        this.isPlaying.set(true);
        const audio = this.currentAudio;
        this.playPromise = audio.play();
        this.playPromise.then(() => {
          this.playPromise = null;
          if (!this.modalService.isOpen() || this.currentAudio !== audio) {
            try { audio.pause(); } catch (e) {}
            return;
          }
          this.isPlaying.set(true);
        }).catch(err => {
          this.playPromise = null;
          if (this.currentAudio === audio) {
            this.isPlaying.set(false);
          }
        });
      }
    }
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

  toggleSubtitles(): void {
    this.showSubtitles.update(v => !v);
  }

  async toggleDictation(): Promise<void> {
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
          this.messages.update(msgs => [...msgs, { sender: 'user', text: '🎤 [Domanda vocale inviata...]', type: 'audio' }]);
          this.executeCommand({}, audioBlob);
        };

        this.mediaRecorder.start();
        this.isDictating.set(true);
      } catch (err) {
        console.error('Impossibile accedere al microfono:', err);
      }
    } else {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      this.isDictating.set(false);
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
      }
    };
    audio.onerror = () => {
      if (this.currentAudio === audio) {
        this.isPlaying.set(false);
      }
    };
  }

  private playAudioSource(src: string): void {
    if (!this.modalService.isOpen()) return;
    this.initAudioElement(src);
    if (this.currentAudio) {
      const audio = this.currentAudio;
      this.isPlaying.set(true);
      this.playPromise = audio.play();
      this.playPromise.then(() => {
        this.playPromise = null;
        if (!this.modalService.isOpen() || this.currentAudio !== audio) {
          try { audio.pause(); } catch (e) {}
          return;
        }
        this.isPlaying.set(true);
      }).catch(err => {
        this.playPromise = null;
        if (this.currentAudio === audio) {
          this.isPlaying.set(false);
        }
      });
    }
  }

  private stopAudio(): void {
    if (this.commandAbortController) {
      this.commandAbortController.abort();
      this.commandAbortController = null;
    }
    this.isPlaying.set(false);
    this.audioCurrentTime.set(0);
    this.audioDuration.set(0);

    if (this.currentAudio) {
      const audio = this.currentAudio;
      this.currentAudio = null;

      audio.ontimeupdate = null;
      audio.onloadedmetadata = null;
      audio.onended = null;
      audio.onerror = null;

      if (this.playPromise) {
        this.playPromise.then(() => {
          try {
            audio.pause();
            audio.currentTime = 0;
            audio.removeAttribute('src');
            audio.load();
          } catch (e) {}
        }).catch(() => {
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

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {}
    }
    this.isDictating.set(false);
  }

  private resetState(): void {
    this.stopAudio();
    this.currentSubtitle.set('');
    this.messages.set([]);
  }

  private formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
