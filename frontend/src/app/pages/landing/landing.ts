import { Component } from '@angular/core';
import { Picture, PictureComponent } from '../../components/picture/picture';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'landing-page',
  standalone: true,
  imports: [
    PictureComponent,
    RouterLink
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class LandingComponent {
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

    { dimension: 'invisible', url: "/Gambero.png" },
    { dimension: 'large', url: "/DenunciaSociale.jpeg" },
    { dimension: 'small', url: "/CuboGambero.png" },
  ] as const;
}
