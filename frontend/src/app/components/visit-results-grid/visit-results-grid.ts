import { Component, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'
import { VisitHomePresentationResponse } from '../../models/visit.model';
import { VisitCard } from '../visit-card/visit-card';

const dummyVisitsHome: VisitHomePresentationResponse[] = [
  {
    id: "home-visit-uuid-987",
    title: "Tour Esclusivo del Louvre al Tramonto",
    description: "Vivi la magia del museo più famoso al mondo senza la folla, accompagnato da una guida esperta.",
    verified: true,
    disabledFriendly: true,
    badge: "Consigliato",
    imageUrls: [
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1565098772267-60af42b81ef2?q=80&w=800&auto=format&fit=crop"
    ],
    duration: 2.5,
    free: true,
    cost: 35.00
  },
  {
    id: "home-visit-uuid-988",
    title: "Capolavori degli Uffizi con Guida",
    description: "Un viaggio indimenticabile tra i capolavori del Rinascimento italiano senza fare la fila.",
    verified: true,
    disabledFriendly: true,
    badge: "Popolare",
    imageUrls: [
      "https://images.unsplash.com/photo-1518998053401-87891849db96?q=80&w=800&auto=format&fit=crop"
    ],
    duration: 2.0,
    free: false,
    cost: 29.00
  },
  {
    id: "home-visit-uuid-989",
    title: "Passeggiata Storica nei Giardini Vaticani",
    description: "Esplora i magnifici giardini e le meraviglie nascoste all'aperto in totale autonomia.",
    verified: false,
    disabledFriendly: false,
    badge: "Gratis",
    imageUrls: [
      "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=800&auto=format&fit=crop"
    ],
    duration: 1.5,
    free: true,
    cost: 0.00
  }
];

@Component({
  selector: 'app-visit-results-grid',
  imports: [VisitCard, CommonModule],
  templateUrl: './visit-results-grid.html',
  styleUrl: './visit-results-grid.css',
})
export class VisitResultsGrid implements OnInit{
  //visits = input.required<VisitHomePresentationResponse[]>();
  //isLoading = input.required<boolean>();

  visits = signal<VisitHomePresentationResponse[]>(dummyVisitsHome);
  isLoading = signal<boolean>(true);

  ngOnInit() {
    setTimeout(() => {
      this.isLoading.set(false); // Dopo 2 secondi, spegne gli skeleton e mostra le card!
    }, 2000);
  }

  onSelectedCard = output<void>();
}
