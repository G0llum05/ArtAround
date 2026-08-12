import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Carousel } from '../../components/carousel/carousel';
import { toSignal } from '@angular/core/rxjs-interop';
import { VisitService } from '../../services/visit.service';
import { MuseumService } from '../../services/museum.service';
import { VisitHomePresentationResponse } from '../../models/visit.model';
import { finalize } from 'rxjs'

import { CardGrid } from '../../components/card-grid/card-grid';
import { MuseumCard } from '../../components/museum-card/museum-card';
import {MuseumHomePresentationResponse} from '../../models/museum.model';

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
  imports: [CommonModule, RouterLink, Carousel, CardGrid, MuseumCard],
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

  private visitService = inject(VisitService);
  recommendedExhibitions = toSignal(this.visitService.getHomePresentation(), { initialValue: [] });

  private museumService = inject(MuseumService);
  isLoadingMuseums = signal<boolean>(true);
  allMuseums = toSignal(this.museumService.getMuseumHomePresentation().pipe(
      finalize( () => this.isLoadingMuseums.set(false))
    )
    , { initialValue: [] });
}
