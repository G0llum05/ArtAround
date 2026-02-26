import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

export interface Art {
  title: string;
  description: string;
}

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private http = inject(HttpClient);
  arts: Art[] = [];
  newArt: Art = {title: '', description: ''};

  errorMessage: string | null = null;
  isLoading: boolean = false; // <-- Nuovo stato per il caricamento

  ngOnInit() {
    this.loadArts();
  }

  loadArts() {
    this.isLoading = true; // Accendiamo il caricamento
    this.http.get<Art[]>('http://localhost:3000/api/visits')
      .subscribe({
        next: (contents: Art[]) => {
          this.arts = contents;
          this.isLoading = false; // Spegniamo il caricamento
        },
        error: (error) => {
          console.log(error);
          this.errorMessage = "Errore di connessione. La galleria è attualmente in restauro.";
          this.isLoading = false;
        },
      });
  }

  immaginiDisponibili = [
    '/Gambero.png'
  ]

  addArt() {
    this.http.post<Art>('http://localhost:3000/api/visits', this.newArt)
      .subscribe({
        next: (art: Art) => {
          this.arts.unshift(art); // Usiamo unshift per metterla in cima alla lista!
          this.newArt = {title: '', description: ''};
          this.errorMessage = null;
        },
        error: (error) => {
          console.log(error);
          this.errorMessage = "Impossibile esporre l'opera in questo momento.";
          setTimeout(() => { this.errorMessage = null; }, 4000);
        },
      });
  }
}
