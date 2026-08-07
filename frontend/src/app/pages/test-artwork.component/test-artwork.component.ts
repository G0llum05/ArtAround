import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArtworkService } from '../../services/opera.service';
import { ArtistService } from '../../services/artist.service';
import { MuseumService } from '../../services/museum.service';

@Component({
  selector: 'app-test-artwork',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './test-artwork.component.html',
  styleUrl: './test-artwork.component.css',
})
export class TestArtworkComponent implements OnInit {
  artworks: any[] = [];
  artists: any[] = [];
  museums: any[] = [];

  artworkForm = {
    title: '',
    startYear: null as number | null,
    endYear: null as number | null,
    selectedArtistId: '',
    selectedMuseumId: '',
    artisticCurrents: '',
    isActive: true,
    isPrivate: false
  };

  feedbackMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private artworkService: ArtworkService,
    private artistService: ArtistService,
    private museumService: MuseumService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.artworkService.getAllArtworks().subscribe({
      next: (res) => (this.artworks = res),
      error: (err) => console.warn('Errore durante il caricamento degli artwork:', err)
    });

    this.artistService.getAllArtists().subscribe({
      next: (res) => (this.artists = res),
      error: (err) => console.warn('Errore durante il caricamento degli artisti:', err)
    });

    this.museumService.getAllMuseums().subscribe({
      next: (res) => (this.museums = res),
      error: (err) => console.warn('Errore durante il caricamento dei musei:', err)
    });
  }

  createArtwork(): void {
    if (!this.artworkForm.title) {
      this.errorMessage = 'Il titolo dell\'opera è obbligatorio.';
      return;
    }

    const currents = this.artworkForm.artisticCurrents
      ? this.artworkForm.artisticCurrents.split(',').map(c => c.trim()).filter(Boolean)
      : [];

    const payload: any = {
      title: this.artworkForm.title,
      startYear: this.artworkForm.startYear,
      endYear: this.artworkForm.endYear,
      artisticCurrents: currents,
      isActive: this.artworkForm.isActive,
      isPrivate: this.artworkForm.isPrivate
    };

    if (this.artworkForm.selectedArtistId) {
      payload.artists = [this.artworkForm.selectedArtistId];
    }
    if (this.artworkForm.selectedMuseumId) {
      payload.museum = this.artworkForm.selectedMuseumId;
    }

    this.artworkService.createArtwork(payload).subscribe({
      next: (res) => {
        this.feedbackMessage = `Opera "${res.title}" creata con successo! (ID: ${res._id})`;
        this.errorMessage = null;
        this.artworkForm = {
          title: '',
          startYear: null,
          endYear: null,
          selectedArtistId: '',
          selectedMuseumId: '',
          artisticCurrents: '',
          isActive: true,
          isPrivate: false
        };
        this.loadData();
      },
      error: (err) => {
        this.errorMessage = 'Errore durante la creazione dell\'opera: ' + (err.error?.message || err.message);
      }
    });
  }
}
