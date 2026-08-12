import { Component, input, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common'

import { ItineraryStep } from '../../models/appModel/itineraryStep'
import { ArtworkResponse } from '../../models/artwork.model';


@Component({
  selector: 'app-itinerary',
  imports: [CommonModule],
  templateUrl: './itinerary.html',
  styleUrl: './itinerary.css',
})
export class Itinerary {
  itinerary = input.required<ArtworkResponse[]>();
  currentArtworkIndex = input.required<number>();
  itinerarySteps = computed<ItineraryStep[]>(() => this.buildItinerarySteps(this.itinerary(), this.currentArtworkIndex()));

  clickedOnItineraryStep = output<number>();

  //conversione in step dell'itinerario per più facile gestione
  buildItinerarySteps(artworks: ArtworkResponse[], currentIndex: number): ItineraryStep[] {
    // 1. Mappiamo le opere del visit.model nel nostro formato visivo
    const allSteps: ItineraryStep[] = artworks.map((art, index) => ({
      id: art.id,
      title: art.title,
      room: art.location?.room || 'Sala non specificata',
      floor: art.location?.floor || 'Piano terra',
      duration: '10m', //TODO inserire la durata dell'artwork se la si vuole
      completed: index < currentIndex,
      isCurrent: index === currentIndex
    }));
    return allSteps;
  }

  clickedInterestOfIndex(index: number) {
    this.clickedOnItineraryStep.emit(index);
  }

}
