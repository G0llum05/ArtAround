import {Component, HostListener} from '@angular/core';
import { Picture, PictureComponent } from '../../components/picture/picture.component';
import { GalleryWallComponent } from '../../components/gallery-wall/gallery-wall.component';

@Component({
  selector: 'gallery-wall-page',
  standalone: true,
  imports: [
    PictureComponent,
    GalleryWallComponent,
  ],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.css',
})
export class GalleryPage {
  pictures: Picture[] = [
    { dimension: 'invisible', url: "" },
    { dimension: 'invisible', url: "" },
    { dimension: 'huge', url: "/images/GamberettoAllaBolognese.jpeg"},
    { dimension: 'large', url: "/images/Gamberone.jpeg" },
    { dimension: 'small', url: "/images/ImpressioneDiGambero.png" },
    { dimension: 'invisible', url: "" },

    { dimension: 'large', url: "/images/DavideEGr8lia.jpeg" },
    { dimension: 'tall', url: "/images/Gambero.png" },
    { dimension: 'huge', url: "/images/GamberoPop.png" },
    { dimension: 'small', url: "/images/GamberoLove.png" },

    { dimension: 'invisible', url: "" },
    { dimension: 'large', url: "/images/DenunciaSociale.jpeg" },
    { dimension: 'small', url: "/images/CuboGambero.png" },
  ] as const;

  overlayOpacity: number = 1;
  @HostListener("window:scroll")
  onWindowScroll() {
    const scrollPosition = window.scrollY || document.documentElement.scrollTop || 0;
    const fadeDistance = 450; // The distance over which the fade effect occurs
    this.overlayOpacity = Math.max(0, 1-(scrollPosition/fadeDistance)); // Adjust the opacity based on scroll position
  }
}
