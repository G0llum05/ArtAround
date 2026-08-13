import { Component, input, signal, Signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common'
import { Router } from '@angular/router'
import { VisitHomePresentationResponse } from '../../models/visit.model';
import { BadgesList } from '../badges-list/badges-list';

@Component({
  selector: 'app-visit-card',
  imports: [CommonModule, BadgesList],
  templateUrl: './visit-card.html',
  styleUrl: './visit-card.css',
})
export class VisitCard {
  visit = input.required<VisitHomePresentationResponse>();

  router = inject(Router);

  imageUrl = computed(() => {
    const visit = this.visit();
    if (visit.assets.images && visit.assets.images.length > 0) {
      return visit.assets.images[0];
    } else {
      return '/assets/images/place_holder.jpg';
    }
  });

  formatedDuration: Signal<string> = computed(
    () => {
      const duration = this.visit().duration;
      if (duration >= 60) {
        const h = Math.floor(duration / 60);
        const m = duration % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
      }
      return `${duration}m`;
    }
  )

  //si leggerà toSignal(this.route.paramMap.map(params => params.get('id')));
  onCardClick(): void {
    this.router.navigate(['/visit', this.visit().id]);
  }


}
