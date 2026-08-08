import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MuseumService } from '../../services/museum.service';
import { FileUploaderComponent, UploadedFileResult } from '../../components/file-uploader/file-uploader.component';

export interface MuseumItem {
  _id?: string;
  name: string;
  description?: string;
  address?: {
    street?: string;
    city?: string;
    country?: string;
  };
  images?: string[];
}

@Component({
  selector: 'app-test-museum',
  standalone: true,
  imports: [CommonModule, FormsModule, FileUploaderComponent],
  templateUrl: './test-museum.component.html',
  styleUrl: './test-museum.component.css',
})
export class TestMuseumComponent implements OnInit {
  museums: MuseumItem[] = [];
  selectedMuseumId: string = 'm123';
  selectedVisitId: string = '';
  selectedArtworkId: string = '';
  uploadType: 'museum-meta' | 'visit-meta' | 'visit-artwork' | 'museum-artwork' = 'museum-meta';

  // Form per la creazione rapida di un nuovo museo
  newMuseumName: string = '';
  newMuseumCity: string = 'Milano';
  newMuseumCountry: string = 'Italia';

  // Stato caricamenti e immagini salvate
  uploadedImages: UploadedFileResult[] = [];
  feedbackMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(private museumService: MuseumService) {}

  ngOnInit(): void {
    this.loadMuseums();
  }

  loadMuseums(): void {
    this.museumService.getAllMuseums().subscribe({
      next: (data) => {
        this.museums = data;
        if (this.museums.length > 0 && this.museums[0]._id) {
          this.selectedMuseumId = this.museums[0]._id;
        }
      },
      error: (err) => {
        console.warn('Impossibile caricare i musei dal backend (utilizzando ID predefinito):', err);
      }
    });
  }

  createNewMuseum(): void {
    if (!this.newMuseumName.trim()) return;

    const payload = {
      name: this.newMuseumName,
      address: {
        city: this.newMuseumCity,
        country: this.newMuseumCountry
      }
    };

    this.museumService.createMuseum(payload).subscribe({
      next: (res) => {
        this.feedbackMessage = `Museo "${res.name}" creato con successo!`;
        if (res._id) {
          this.selectedMuseumId = res._id;
        }
        this.newMuseumName = '';
        this.loadMuseums();
      },
      error: (err) => {
        this.errorMessage = 'Errore durante la creazione del museo: ' + err.message;
      }
    });
  }

  get isMetaMode(): boolean {
    return this.uploadType === 'museum-meta' || this.uploadType === 'visit-meta';
  }

  get activeVisitId(): string | undefined {
    return (this.uploadType === 'visit-meta' || this.uploadType === 'visit-artwork') ? this.selectedVisitId : undefined;
  }

  get activeArtworkId(): string | undefined {
    return (this.uploadType === 'visit-artwork' || this.uploadType === 'museum-artwork') ? this.selectedArtworkId : undefined;
  }

  onUploadSuccess(files: UploadedFileResult[]): void {
    this.uploadedImages = [...this.uploadedImages, ...files];
    this.feedbackMessage = `${files.length} immagine/i WebP caricate con successo nel percorso del museo!`;
    this.errorMessage = null;
  }

  onUploadError(err: any): void {
    console.error('Upload Error:', err);
    this.errorMessage = 'Si è verificato un errore durante il caricamento delle immagini.';
  }

  get currentDirectoryPath(): string {
    const museum = this.selectedMuseumId || ':museumId';
    if (this.uploadType === 'museum-meta') {
      return `assets/museums/${museum}/meta`;
    }
    if (this.uploadType === 'visit-meta') {
      const visit = this.selectedVisitId || ':visitId';
      return `assets/museums/${museum}/visit/${visit}/meta`;
    }
    if (this.uploadType === 'visit-artwork') {
      const visit = this.selectedVisitId || ':visitId';
      const artwork = this.selectedArtworkId || ':artworkId';
      return `assets/museums/${museum}/visit/${visit}/${artwork}`;
    }
    if (this.uploadType === 'museum-artwork') {
      const artwork = this.selectedArtworkId || ':artworkId';
      return `assets/museums/${museum}/${artwork}`;
    }
    return `assets/museums/${museum}/meta`;
  }
}
