import { Component, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'
import { VisitHomePresentationResponse } from '../../models/visit.model';
import { VisitCard } from '../visit-card/visit-card';

@Component({
  selector: 'app-visit-results-grid',
  imports: [VisitCard, CommonModule],
  templateUrl: './visit-results-grid.html',
  styleUrl: './visit-results-grid.css',
})
export class VisitResultsGrid{
  visits = input.required<VisitHomePresentationResponse[]>();
  isLoading = input<boolean>(false);
  onSelectedCard = output<void>();
}
