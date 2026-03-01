import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {PictureComponent, Picture} from './picture/picture';

export interface Art {
  title: string;
  description: string;
}

@Component({
  selector: 'app-root',
  imports: [
    PictureComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private http = inject(HttpClient);
  arts: Art[] = [];
  newArt: Art = {title: '', description: ''};

  quadri: Picture[] = [
    { dimension: 'invisible', url: "" },
    { dimension: 'invisible', url: "" },
    { dimension: 'huge', url: "/GamberettoAllaBolognese.jpeg"},
    { dimension: 'large', url: "/Gamberone.jpeg" },
    { dimension: 'small', url: "/ImpressioneDiGambero.png" },
    { dimension: 'invisible', url: "" },

    { dimension: 'large', url: "/DavideEGr8lia.jpeg" },
    { dimension: 'tall', url: "/Gambero.png" },
    { dimension: 'huge', url: "/GamberoPop.png" },
    { dimension: 'small', url: "/GamberoLove.png" },

    { dimension: 'invisible', url: "/Gambero.png" },
    { dimension: 'large', url: "/DenunciaSociale.jpeg" },
    { dimension: 'small', url: "/CuboGambero.png" },
  ] as const;

  errorMessage: string | null = null;
  isLoading: boolean = false; // <-- Nuovo stato per il caricamento

  ngOnInit() {
    this.loadArts();
  }

  loadArts() {
    this.isLoading = true; // Accendiamo il caricamento
    this.http.get<Art[]>('/api/visits')
      .subscribe({
        next: (contents: Art[]) => {
          this.arts = contents;
          this.isLoading = false; // Spegniamo il caricamento
        },
        error: (error) => {
          console.log(error);
          this.errorMessage = "Errore di connessione. La galleria è attualmente in restauro.";
          this.isLoading = false;
        },
      });
  }

  immaginiDisponibili = [
    '/Gambero.png'
  ]

  addArt() {
    this.http.post<Art>('/api/visits', this.newArt)
      .subscribe({
        next: (art: Art) => {
          this.arts.unshift(art); // Usiamo unshift per metterla in cima alla lista!
          this.newArt = {title: '', description: ''};
          this.errorMessage = null;
        },
        error: (error) => {
          console.log(error);
          this.errorMessage = "Impossibile esporre l'opera in questo momento.";
          setTimeout(() => { this.errorMessage = null; }, 4000);
        },
      });
  }
}
