import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VisitService } from '../../services/visit.service';
import { ArtworkService } from '../../services/opera.service';

@Component({
  selector: 'app-test-visit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './test-visit.component.html',
  styleUrl: './test-visit.component.css',
})
export class TestVisitComponent implements OnInit {
  artworks: any[] = [];
  visits: any[] = [];

  visitForm = {
    title: '',
    description: '',
    price: 0,
    minDuration: 30,
    maxDuration: 60,
    categories: '',
    selectedArtworkIds: [] as string[],
    disabledFriendly: true
  };

  selectedVisitForImages: string = '';
  resolvedVisitData: any = null;

  feedbackMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private visitService: VisitService,
    private artworkService: ArtworkService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.artworkService.getAllArtworks().subscribe({
      next: (res) => (this.artworks = res),
      error: (err) => console.warn('Errore durante il caricamento degli artwork:', err)
    });

    this.visitService.getAllVisits().subscribe({
      next: (res) => (this.visits = res),
      error: (err) => console.warn('Errore durante il caricamento delle visite:', err)
    });
  }

  createVisit(): void {
    if (!this.visitForm.title) {
      this.errorMessage = 'Il titolo della visita è obbligatorio.';
      return;
    }

    const categoriesList = this.visitForm.categories
      ? this.visitForm.categories.split(',').map(c => c.trim()).filter(Boolean)
      : [];

    const payload = {
      title: this.visitForm.title,
      description: this.visitForm.description,
      price: this.visitForm.price,
      minDuration: this.visitForm.minDuration,
      maxDuration: this.visitForm.maxDuration,
      categories: categoriesList,
      artworks: this.visitForm.selectedArtworkIds,
      disabledFriendly: this.visitForm.disabledFriendly,
      active: true
    };

    this.visitService.createVisit(payload).subscribe({
      next: (res) => {
        this.feedbackMessage = `Visita "${res.title}" creata con successo! (ID: ${res.id || res._id})`;
        this.errorMessage = null;
        this.visitForm = {
          title: '',
          description: '',
          price: 0,
          minDuration: 30,
          maxDuration: 60,
          categories: '',
          selectedArtworkIds: [],
          disabledFriendly: true
        };
        this.loadData();
      },
      error: (err) => {
        this.errorMessage = 'Errore durante la creazione della visita: ' + (err.error?.message || err.message);
      }
    });
  }

  resolveVisitArtworkImages(): void {
    if (!this.selectedVisitForImages) return;

    this.visitService.getVisitArtworkImages(this.selectedVisitForImages).subscribe({
      next: (res) => {
        this.resolvedVisitData = res;
        this.feedbackMessage = `Immagini della visita "${res.title}" risolte con successo! (${res.artworks?.length || 0} opere trovate).`;
        this.errorMessage = null;
      },
      error: (err) => {
        this.errorMessage = 'Errore nella risoluzione immagini della visita: ' + (err.error?.message || err.message);
      }
    });
  }

  toggleArtworkSelection(artworkId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.visitForm.selectedArtworkIds.includes(artworkId)) {
        this.visitForm.selectedArtworkIds.push(artworkId);
      }
    } else {
      this.visitForm.selectedArtworkIds = this.visitForm.selectedArtworkIds.filter(id => id !== artworkId);
    }
  }
}
