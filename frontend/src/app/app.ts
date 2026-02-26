import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

export interface  Art {
  title: string;
  description: string;
}

@Component({
  selector: 'app-root',
  imports: [
    FormsModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private http = inject(HttpClient);
  arts: Art[] = [];
  newArt: Art = {title: '', description: ''};

  errorMessage: string | null = null;

  ngOnInit() {
    this.loadArts();
  }

  loadArts() {
    this.http.get<Art[]>('http://localhost:3000/api/arts')
      .subscribe({
        next: (contents: Art[]) => this.arts = contents,
        error: (error: Error) => {
          console.log(error);
          this.errorMessage = "Errore nel caricamento delle opere. Il server è acceso?";
        },
      });
  }

  addArt() {
    this.http.post<Art>('http://localhost:3000/api/arts', this.newArt)
      .subscribe({
        next: (art: Art) => {
          this.arts.push(art);   //aggiungo alla lista locale
          this.newArt = {title: '', description: ''};
        },
        error: (error: Error) => {
          console.log(error);
          this.errorMessage = "Errore nell'aggiunta dell'opera. Il server è acceso?";
          setTimeout(() => {
            this.errorMessage = null, 3000}
          ); //nascondo dopo 3 secondi
        },
      });
  }
}
