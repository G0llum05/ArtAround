import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MuseumHomePresentationResponse } from '../../models/museum.model';
import { BadgesList } from '../badges-list/badges-list';
import { TruncatePipe } from '../../pipes/truncate-pipe';

@Component({
  selector: 'app-museum-card',
  standalone: true,
  imports: [CommonModule, BadgesList, TruncatePipe],
  templateUrl: './museum-card.html',
  styleUrl: './museum-card.css',
})
export class MuseumCard {
  museum = input.required<MuseumHomePresentationResponse>();

  router = inject(Router);

  onCardClick(): void {
    this.router.navigate(['/marketplace/museum', this.museum().id]);
  }

  getImageUrl(item: MuseumHomePresentationResponse): string {
    const place_holder = '/assets/images/place_holder.jpg';
    return item.assets?.images?.find(image => image.orientation === 'landscape')?.url || place_holder;
  }
}
