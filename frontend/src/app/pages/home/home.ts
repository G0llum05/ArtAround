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
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, Carousel, CardGrid, MuseumCard],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  authService = inject(AuthService);

  //TODO VISITA CORRENTE

  private visitService = inject(VisitService);
  isLoadingVisits = signal<boolean>(true)
  recommendedExhibitions = toSignal(this.visitService.getHomePresentation().pipe(
    finalize(() => this.isLoadingVisits.set(false)),
    )
    , { initialValue: [] });

  private museumService = inject(MuseumService);
  isLoadingMuseums = signal<boolean>(true);
  //finalize si attiva sempre anche quando fallisce
  allMuseums = toSignal(this.museumService.getMuseumHomePresentation()
  .pipe(
    finalize( () => this.isLoadingMuseums.set(false) )
  ),
  { initialValue: [] });
}
