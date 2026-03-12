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
    { dimension: 'small', url: "/images/GamberettoAllaBolognese.jpeg" },
    { dimension: 'large', url: "/images/Gamberone.jpeg" },
    { dimension: 'small', url: "/images/ImpressioneDiGambero.png" },
    { dimension: 'tall', url: "/images/GamberoNebbiano.jpeg" },
    { dimension: 'large', url: "/images/UltimaCenaABaseDiGambero.jpeg" },
    { dimension: 'small', url: "/images/MattiasDream.jpeg" },
    { dimension: 'small', url: "/images/ImpressioneDiGambero.png" },
    { dimension: 'tall', url: "/images/LaBallataDellAmorePerduto.jpeg" },
    { dimension: 'large', url: "/images/DavideEGr8lia.jpeg" },
    { dimension: 'tall', url: "/images/Gambero.png" },
    { dimension: 'small', url: "/images/GamberoPop.png" },
    { dimension: 'huge', url: "/images/GamberoLove.png" },
    { dimension: 'large', url: "/images/DenunciaSociale.jpeg" },
    { dimension: 'small', url: "/images/CuboGambero.png" },
    { dimension: 'small', url: "/images/GamberettoAllaBolognese.jpeg" },
    { dimension: 'large', url: "/images/Gamberone.jpeg" },
    { dimension: 'small', url: "/images/DenunciaSociale.jpeg" },
    { dimension: 'large', url: "/images/DavideEGr8lia.jpeg" },
    { dimension: 'tall', url: "/images/Gambero.png" },
    { dimension: 'small', url: "/images/GamberoPop.png" },
    { dimension: 'small', url: "/images/ImpressioneDiGambero.png" },
    { dimension: 'small', url: "/images/MattiasDream.jpeg" },
    { dimension: 'small', url: "/images/GamberoLove.png" },
    { dimension: 'large', url: "/images/DenunciaSociale.jpeg" },
    { dimension: 'small', url: "/images/CuboGambero.png" },
    { dimension: 'small', url: "/images/GamberettoAllaBolognese.jpeg" },
    { dimension: 'large', url: "/images/Gamberone.jpeg" },
    { dimension: 'small', url: "/images/ImpressioneDiGambero.png" },
    { dimension: 'large', url: "/images/DavideEGr8lia.jpeg" },
    { dimension: 'tall', url: "/images/Gambero.png" },
    { dimension: 'small', url: "/images/GamberoPop.png" },
    { dimension: 'small', url: "/images/GamberoLove.png" },
    { dimension: 'large', url: "/images/DenunciaSociale.jpeg" },
    { dimension: 'small', url: "/images/CuboGambero.png" },
    { dimension: 'small', url: "/images/GamberettoAllaBolognese.jpeg" },
    { dimension: 'large', url: "/images/Gamberone.jpeg" },
    { dimension: 'small', url: "/images/ImpressioneDiGambero.png" },
    { dimension: 'large', url: "/images/DavideEGr8lia.jpeg" },
    { dimension: 'tall', url: "/images/Gambero.png" },
    { dimension: 'huge', url: "/images/GamberoPop.png" },
    { dimension: 'small', url: "/images/GamberoLove.png" },
    { dimension: 'huge', url: "/images/LaBallataDellAmorePerduto.jpeg" },
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
