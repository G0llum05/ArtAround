import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Carousel } from '../../components/carousel/carousel';
import { toSignal } from '@angular/core/rxjs-interop';
import { VisitService } from '../../services/visit.service';

interface ArtworkPlaceholder {
  id: string;
  title: string;
  author: string;
  location: string;
  imageUrl: string;
}


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, Carousel],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  userName = signal<string>('John Doe');

  activeVisit = signal<ArtworkPlaceholder>({
    id: '123',
    title: 'Gamberetto allo spiedo',
    author: 'Gr8llo',
    location: 'Geologia G1',
    imageUrl: '/assets/images/place_holder.jpg'
  });

  /*activeVisit = signal<ArtworkPlaceholder | null>(null)*/

  private visitService = inject(VisitService);

  recommendedExhibitions = toSignal(this.visitService.getHomePresentation(), { initialValue: [] });

}
