import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-navigator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './navigator.html',
  styleUrl: './navigator.css'
})
export class Navigator {
  // Stati UI
  isPlaying = signal<boolean>(false);
  showSubtitles = signal<boolean>(true);
  volume = signal<number>(50);

  // Chat e Dettatura
  chatText = signal<string>('');
  isDictating = signal<boolean>(false);

  // Sottotitoli
  currentSubtitle = signal<string>("Nel dipinto possiamo notare i dettagli delle vesti dorate...");

  // Itinerario
  itinerary = signal([
    { id: 1, title: 'Sala del Trono', duration: '10 min', completed: true },
    { id: 2, title: 'Galleria degli Specchi', duration: '15 min', completed: false },
    { id: 3, title: 'Appartamenti Reali', duration: '20 min', completed: false },
    { id: 4, title: 'Giardini all\'Italiana', duration: '30 min', completed: false }
  ]);

  remainingChars = computed(() => 200 - (this.chatText()?.length || 0));

  togglePlay(): void {
    this.isPlaying.update(v => !v);
  }

  toggleSubtitles(): void {
    this.showSubtitles.update(v => !v);
  }

  toggleDictation(): void {
    this.isDictating.update(v => !v);
    if (this.isDictating()) {
      setTimeout(() => {
        this.chatText.update(text => text + " Mi puoi spiegare meglio questo dettaglio?");
        this.isDictating.set(false);
      }, 2000);
    }
  }

  openSettings(): void {
    console.log("Apertura impostazioni...");
  }

  openMap(): void {
    console.log("Apertura mappa...");
  }

  tellMeMore(): void {
    console.log("Richiesta maggiori informazioni sull'opera...");
  }
}
