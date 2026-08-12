import { Component, input, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'
import {VisitHomePresentationResponse} from '../../models/visit.model';
import {BadgesList} from '../badges-list/badges-list';

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [CommonModule, BadgesList],
  templateUrl: './carousel.html',
  styleUrl: './carousel.css'
})
export class Carousel implements OnInit, OnDestroy {
  items = input.required<VisitHomePresentationResponse[]>();
  autoPlayInterval = input(5000)

  currentIndex = signal<number>(0);
  isInstant = signal<boolean>(false);

  private timer: any;
  private animationTimer: any;

  private readonly router = inject(Router);

  // Lista virtuale con il primo elemento duplicato in fondo
  extendedItems = computed(() => {
    if (!this.items() || this.items().length === 0) return [];
    let duplicatedItem = {
      ...this.items()[0],
      id: "duplicatedItemId",
    };
    return [...this.items(), duplicatedItem];
  });

  ngOnInit(): void {
    this.startAutoPlay();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
    clearTimeout(this.animationTimer);
  }

  learnMore(visitId: string): void {
    this.router.navigate(['/marketplace/marketplace.html/visit', visitId]);
  }

  startAutoPlay(): void {
    this.stopAutoPlay();
    if (this.items() && this.items().length > 1) {
      this.timer = setInterval(() => {
        this.next();
      }, this.autoPlayInterval());
    }
  }

  stopAutoPlay(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private resetAutoPlayTimer(): void {
    if (this.timer) {
      this.startAutoPlay();
    }
  }

  next(): void {
    if (!this.items() || this.items().length === 0) return;

    // Pulisci eventuali timeout pendenti per evitare conflitti
    this.resetAutoPlayTimer();
    //evito spam click
    if(this.animationTimer) {
      return;
    }

    this.isInstant.set(false);
    const current = this.currentIndex();
    const lastRealIndex = this.items().length - 1;

    if (current == lastRealIndex) {
      // Siamo sull'ultima slide originale, andiamo sul clone (indice items.length)
      this.currentIndex.set(this.items().length);

      // Aspettiamo che finisca l'animazione visiva, poi resettiamo a 0 senza animazione
      this.animationTimer = setTimeout(() => {
        this.isInstant.set(true); // Spegniamo la transizione
        this.currentIndex.set(0);  // Salto istantaneo all'inizio originale
        this.animationTimer = null;
      }, 1500); // Deve coincidere esattamente con la durata dell'animazione CSS (1.5s)
    } else {
      this.currentIndex.set(current + 1);
    }
  }

  prev(): void {
    if (!this.items() || this.items().length === 0) return;

    clearTimeout(this.animationTimer);
    this.resetAutoPlayTimer();

    const current = this.currentIndex();
    const lastRealIndex = this.items().length - 1;

    if (current <= 0) {
      this.isInstant.set(true);
      this.currentIndex.set(this.items().length); // Posizione del clone

      setTimeout(() => {
        this.isInstant.set(false);
        this.currentIndex.set(lastRealIndex);
      }, 20);
    } else {
      this.isInstant.set(false);
      this.currentIndex.set(current - 1);
    }
  }

  goTo(index: number): void {
    if (index >= 0 && index < this.items().length) {
      clearTimeout(this.animationTimer);
      this.isInstant.set(false);
      this.currentIndex.set(index);
    }
  }
}
