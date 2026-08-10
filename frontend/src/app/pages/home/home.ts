import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Carousel } from '../../components/carousel/carousel';
import {VisitHomePresentationResponse} from '../../models/visit.model';

interface ArtworkPlaceholder {
  id: string;
  title: string;
  author: string;
  location: string;
  imageUrl: string;
}


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, Carousel],
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

  recommendedExhibitions: VisitHomePresentationResponse[] = [
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
      free: false,
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
}
