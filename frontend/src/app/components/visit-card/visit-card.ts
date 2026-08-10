import { Component, input, signal, Signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common'
import { VisitHomePresentationResponse } from '../../models/visit.model';

@Component({
  selector: 'app-visit-card',
  imports: [CommonModule],
  templateUrl: './visit-card.html',
  styleUrl: './visit-card.css',
})
export class VisitCard {
  visit = input.required<VisitHomePresentationResponse>();

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

}
