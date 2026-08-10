import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Carousel } from '../../components/carousel/carousel';
import { VisitHomePresentationResponse } from '../../models/visit.model';
import { BadgesList } from '../../components/badges-list/badges-list';

interface ArtworkPlaceholder {
  id: string;
  title: string;
  author: string;
  location: string;
  imageUrl: string;
}

const dummyVisitsHome: VisitHomePresentationResponse[] = [
  {
    id: "visit-home-1",
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
    free: false,
    cost: 35.00
  },
  {
    id: "visit-home-2",
    title: "Capolavori degli Uffizi con Guida",
    description: "Un viaggio indimenticabile tra i capolavori del Rinascimento italiano saltando la fila.",
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
    id: "visit-home-3",
    title: "Passeggiata Storica nei Giardini Vaticani",
    description: "Esplora i magnifici giardini e le meraviglie all'aperto in totale autonomia e relax.",
    verified: false,
    disabledFriendly: false,
    badge: "Gratis",
    imageUrls: [
      "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=800&auto=format&fit=crop"
    ],
    duration: 1.5,
    free: true,
    cost: 0.00
  },
  {
    id: "visit-home-4",
    title: "I Segreti del British Museum",
    description: "Un percorso interattivo attraverso i millenni di storia e i reperti più iconici del museo.",
    verified: true,
    disabledFriendly: true,
    badge: "Novità",
    imageUrls: [
      "https://images.unsplash.com/photo-1566127444979-b3d2b65463d7?q=80&w=800&auto=format&fit=crop"
    ],
    duration: 3.0,
    free: false,
    cost: 40.00
  }
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, Carousel, BadgesList],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  userName = signal<string>('John Doe');

  activeVisit = signal<ArtworkPlaceholder>({
    id: '123',
    title: 'Gamberetto allo spiedo',
    author: 'Gr8llo',
    location: 'Geologia G1',
    imageUrl: '/assets/images/place_holder.jpg'
  });

  /*activeVisit = signal<ArtworkPlaceholder | null>(null)*/

  recommendedExhibitions = signal<VisitHomePresentationResponse[]>(dummyVisitsHome);
}
