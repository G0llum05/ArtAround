import {Component, HostListener} from '@angular/core';
import { Picture, PictureComponent } from '../../components/picture/picture';
import { GalleryWallComponent } from '../../components/gallery-wall/gallery';

@Component({
  selector: 'gallery-wall-page',
  standalone: true,
  imports: [
    PictureComponent,
    GalleryWallComponent,
  ],
  templateUrl: './gallery.html',
  styleUrl: './gallery.css',
})
export class GalleryPage {
  pictures: Picture[] = [
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

    { dimension: 'invisible', url: "" },
    { dimension: 'large', url: "/DenunciaSociale.jpeg" },
    { dimension: 'small', url: "/CuboGambero.png" },
  ] as const;

  overlayOpacity: number = 1;
  @HostListener("window:scroll")
  onWindowScroll() {
    const scrollPosition = window.scrollY || document.documentElement.scrollTop || 0;
    const fadeDistance = 450; // The distance over which the fade effect occurs
    this.overlayOpacity = Math.max(0, 1-(scrollPosition/fadeDistance)); // Adjust the opacity based on scroll position
  }
}
