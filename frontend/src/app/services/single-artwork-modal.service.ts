import { Injectable, signal } from '@angular/core';
import { ArtworkResponse } from '../models/artwork.model';

@Injectable({
  providedIn: 'root'
})
export class SingleArtworkModalService {
  isOpen = signal<boolean>(false);
  artwork = signal<ArtworkResponse | null>(null);

  open(artwork: ArtworkResponse): void {
    this.artwork.set(artwork);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.artwork.set(null);
  }
}
