import { Component, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Itinerary } from '../../components/itinerary/itinerary';
import { Chat } from '../../components/chat/chat';
import { NavigatorService, StreamChunk } from '../../services/navigator.service';
import { NavigatorSettings } from '../../components/navigator-settings/navigator-settings';
import { ToneType, UserNavigatorSettings } from '../../models/appModel/userNavigatorSettings';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, skip, switchMap } from 'rxjs/operators';
import { Map } from '../../components/map/map';
import { ChatMessage } from '../../models/appModel/chatMessage';


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
  messages = signal<ChatMessage[]>(messagesDummy)
  chatText = signal<string>('');
  isDictating = signal<boolean>(false);


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
  }

  //TODO navigator service inject
  //TODO chiamate api facili inziali come per prendere l'itinerario e tutta la visita si usa to signal

  // Sottotitoli
  currentSubtitle = signal<string>("Nel dipinto possiamo notare i dettagli delle vesti dorate...");

  // Itinerario
  currentItineraryStepIndex = signal<number>(0);
  itinerary = signal(DUMMY_ITINERARY_ARTWORKS);

  remainingChars = computed(() => 200 - (this.chatText()?.length || 0));

  togglePlay(): void {
    this.isPlaying.update(v => !v);
  }

  toggleSubtitles(): void {
    this.showSubtitles.update(v => !v);
    //TODO subtitles
  }

  toggleDictation(): void {
    this.isDictating.update(v => !v);
    //TODO dictation
  }

  openSettings(): void {
    this.isSettingsOpen.set(true);
  }

  openMap(): void {
    this.isMapOpen.set(true);
  }

  tellMeMore(): void {
    console.log("Richiesta maggiori informazioni sull'opera...");
  }

  changeItineraryStep(index: number): void {
    this.currentItineraryStepIndex.set(index);
  }

}
