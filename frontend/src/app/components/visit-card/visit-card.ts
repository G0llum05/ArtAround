import { Component, input, signal } from '@angular/core';
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
}
