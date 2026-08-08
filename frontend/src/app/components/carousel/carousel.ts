import { Component, Input, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carousel.html',
  styleUrl: './carousel.css'
})
export class Carousel implements OnInit, OnDestroy {
  @Input() items: any[] = [];
  @Input() autoPlayInterval: number = 5000;

  currentIndex = signal<number>(0);
  private timer: any;

  ngOnInit(): void {
    this.startAutoPlay();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  startAutoPlay(): void {
    this.stopAutoPlay();
    if (this.items && this.items.length > 1) {
      // Assegna il timer a this.timer e chiama this.next()
      this.timer = setInterval(() => {
        this.next();
      }, this.autoPlayInterval);
    }
  }

  stopAutoPlay(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  next(): void {
    if (!this.items || this.items.length === 0) return;
    this.currentIndex.set((this.currentIndex() + 1) % this.items.length);
  }

  prev(): void {
    if (!this.items || this.items.length === 0) return;
    this.currentIndex.set((this.currentIndex() - 1 + this.items.length) % this.items.length);
  }

  goTo(index: number): void {
    if (index >= 0 && index < this.items.length) {
      this.currentIndex.set(index);
    }
  }
}
