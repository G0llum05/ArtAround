import { Component, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.html',
  styleUrl: './map.css'
})
export class Map {
  // Output per chiedere al padre di chiudere la mappa
  imageUrl = input.required<string>();
  closeMap = output<void>();

  close() {
    this.closeMap.emit();
  }
}
