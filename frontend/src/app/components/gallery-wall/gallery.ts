import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Picture, PictureComponent} from '../picture/picture';

interface Art {
  title: string;
  description: string;
}

@Component({
  selector: 'gallery-wall',
  standalone: true,
  imports: [
    PictureComponent
  ],
  templateUrl: './gallery.html',
  styleUrl: './gallery.css',
})
export class GalleryWallComponent implements OnInit {

  pictures: Picture[] = [
    { dimension: 'small', url: "/GamberettoAllaBolognese.jpeg" }, // Da huge a small
    { dimension: 'large', url: "/Gamberone.jpeg" },
    { dimension: 'small', url: "/ImpressioneDiGambero.png" },
    { dimension: 'tall', url: "/GamberoNebbiano.jpeg" },
    { dimension: 'large', url: "/UltimaCenaABaseDiGambero.jpeg" },
    { dimension: 'small', url: "/MattiasDream.jpeg" },
    { dimension: 'small', url: "/ImpressioneDiGambero.png" },
    { dimension: 'tall', url: "/LaBallataDellAmorePerduto.jpeg" },
    { dimension: 'large', url: "/DavideEGr8lia.jpeg" },
    { dimension: 'tall', url: "/Gambero.png" },
    { dimension: 'small', url: "/GamberoPop.png" }, // Da huge a small
    { dimension: 'huge', url: "/GamberoLove.png" },
    { dimension: 'large', url: "/DenunciaSociale.jpeg" },
    { dimension: 'small', url: "/CuboGambero.png" },
    { dimension: 'small', url: "/GamberettoAllaBolognese.jpeg" }, // Da huge a small
    { dimension: 'large', url: "/Gamberone.jpeg" },
    { dimension: 'small', url: "/DenunciaSociale.jpeg" },
    { dimension: 'large', url: "/DavideEGr8lia.jpeg" },
    { dimension: 'tall', url: "/Gambero.png" },
    { dimension: 'small', url: "/GamberoPop.png" }, // Da huge a small
    { dimension: 'small', url: "/ImpressioneDiGambero.png" },
    { dimension: 'small', url: "/MattiasDream.jpeg" }, // Da huge a small
    { dimension: 'small', url: "/GamberoLove.png" },
    { dimension: 'large', url: "/DenunciaSociale.jpeg" },
    { dimension: 'small', url: "/CuboGambero.png" },
    { dimension: 'small', url: "/GamberettoAllaBolognese.jpeg" },
    { dimension: 'large', url: "/Gamberone.jpeg" },
    { dimension: 'small', url: "/ImpressioneDiGambero.png" },
    { dimension: 'large', url: "/DavideEGr8lia.jpeg" },
    { dimension: 'tall', url: "/Gambero.png" },
    { dimension: 'small', url: "/GamberoPop.png" },
    { dimension: 'small', url: "/GamberoLove.png" },
    { dimension: 'large', url: "/DenunciaSociale.jpeg" },
    { dimension: 'small', url: "/CuboGambero.png" },
    { dimension: 'small', url: "/GamberettoAllaBolognese.jpeg" },
    { dimension: 'large', url: "/Gamberone.jpeg" },
    { dimension: 'small', url: "/ImpressioneDiGambero.png" },
    { dimension: 'large', url: "/DavideEGr8lia.jpeg" },
    { dimension: 'tall', url: "/Gambero.png" },
    { dimension: 'huge', url: "/GamberoPop.png" },
    { dimension: 'small', url: "/GamberoLove.png" },
    { dimension: 'huge', url: "/LaBallataDellAmorePerduto.jpeg" },
  ] as const;
  /* Vero Codice */
  private http = inject(HttpClient);
  arts: Art[] = [];
  newArt: Art = {title: '', description: ''};

  erroreMessage: string | null = null;

  ngOnInit() {
    this.loadArts();
  }

  loadArts() {
    this.http.get<Art[]>('/api/visits')
      .subscribe({
        next: (contents: Art[]) => {
          this.arts = contents;
        },
        error: (error) => {
          this.erroreMessage = error
          console.log(error);
        },
      });
  }

  addArt() {
    this.http.post<Art>('/api/visits', this.newArt)
      .subscribe({
        next: (art: Art) => {
          this.arts.unshift(art); // Usiamo unshift per metterla in cima alla lista!
          this.newArt = {title: '', description: ''};
          this.erroreMessage = null;
        },
        error: (error) => {
          console.log(error);
          this.erroreMessage = "Errore durante il caricamento.";
          setTimeout(() => { this.erroreMessage = null; }, 4000);
        },
      });
  }
}
