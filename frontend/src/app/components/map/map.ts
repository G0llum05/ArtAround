import { Component, output, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MuseumResponse } from '../../models/museum.model';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.html',
  styleUrl: './map.css'
})
export class Map {
  museum = input<MuseumResponse | null | undefined>(null);
  closeMap = output<void>();

  // Restituisce l'URL salvato all'interno di museum.assets.map
  imageUrl = computed<string>(() => {
    return this.museum()?.assets?.map?.url || '/assets/images/place_holder.jpg';
  });

  close() {
    this.closeMap.emit();
  }
}


