import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArtistService } from '../../services/artist.service';

@Component({
  selector: 'app-test-artist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './test-artist.component.html',
  styleUrl: './test-artist.component.css',
})
export class TestArtistComponent implements OnInit {
  artists: any[] = [];
  artistForm = {
    name: '',
    surname: '',
    artisticCurrents: ''
  };

  feedbackMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(private artistService: ArtistService) {}

  ngOnInit(): void {
    this.loadArtists();
  }

  loadArtists(): void {
    this.artistService.getAllArtists().subscribe({
      next: (res) => (this.artists = res),
      error: (err) => console.warn('Errore durante il caricamento degli artisti:', err)
    });
  }

  createArtist(): void {
    if (!this.artistForm.name || !this.artistForm.surname) {
      this.errorMessage = 'Nome e cognome sono obbligatori.';
      return;
    }

    const currents = this.artistForm.artisticCurrents
      ? this.artistForm.artisticCurrents.split(',').map(c => c.trim()).filter(Boolean)
      : [];

    const payload = {
      name: this.artistForm.name,
      surname: this.artistForm.surname,
      artisticCurrents: currents
    };

    this.artistService.createArtist(payload).subscribe({
      next: (res) => {
        this.feedbackMessage = `Artista "${res.name} ${res.surname}" creato con successo! (ID: ${res._id})`;
        this.errorMessage = null;
        this.artistForm = { name: '', surname: '', artisticCurrents: '' };
        this.loadArtists();
      },
      error: (err) => {
        this.errorMessage = 'Errore durante la creazione dell\'artista: ' + (err.error?.message || err.message);
      }
    });
  }
}
