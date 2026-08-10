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

  formatedDuration: Signal<string> = computed(
    () => {
      const duration = this.visit().duration;
      let durationFormated: string = Math.floor(duration).toString() + 'h ';
      if(duration - Math.trunc(duration)==0.5){
        durationFormated += '30m';
      }
      if(duration===8){
        durationFormated += '+';
      }
      return durationFormated;
    }
  )

  //si leggerà toSignal(this.route.paramMap.map(params => params.get('id')));
  onCardClick(): void {
    this.router.navigate(['/visit', this.visit().id]);
  }


}
