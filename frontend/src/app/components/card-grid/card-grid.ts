import { Component, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-card-grid',
  imports: [CommonModule],
  templateUrl: './card-grid.html',
  styleUrl: './card-grid.css',
})
export class CardGrid {
  length = input.required<number>() ;
  isLoading = input<boolean>(false);
}
