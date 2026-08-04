import { Component, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MuseumService } from '../../services/museum.service';

@Component({
  selector: 'gallery-wall-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.css',
})
export class GalleryPage implements OnInit, OnDestroy {
  private museumService = inject(MuseumService);
  private router = inject(Router);

  museums: any[] = [];
  loadingMuseums: boolean = true;

  isPortrait: boolean = false;
  userOverrideMode: 'auto' | 'desktop' | 'portrait' = 'auto';

  redirectCountdown: number = 3;
  private countdownInterval: any = null;

  ngOnInit(): void {
    this.checkOrientation();
    this.loadMuseums();
  }

  ngOnDestroy(): void {
    this.cancelRedirect();
  }

  @HostListener('window:resize')
  @HostListener('window:orientationchange')
  onResize(): void {
    this.checkOrientation();
  }

  checkOrientation(): void {
    if (this.userOverrideMode === 'desktop') {
      this.isPortrait = false;
      this.cancelRedirect();
      return;
    }
    if (this.userOverrideMode === 'portrait') {
      const wasPortrait = this.isPortrait;
      this.isPortrait = true;
      if (!wasPortrait) {
        this.startRedirectCountdown();
      }
      return;
    }

    const portraitMedia = window.matchMedia('(orientation: portrait)');
    const isNarrowMobile = window.innerWidth < 768 && window.innerHeight > window.innerWidth;
    const wasPortrait = this.isPortrait;
    
    this.isPortrait = portraitMedia.matches || isNarrowMobile;

    if (this.isPortrait && !wasPortrait) {
      this.startRedirectCountdown();
    } else if (!this.isPortrait) {
      this.cancelRedirect();
    }
  }

  setOverrideMode(mode: 'auto' | 'desktop' | 'portrait'): void {
    this.userOverrideMode = mode;
    this.checkOrientation();
  }

  startRedirectCountdown(): void {
    this.cancelRedirect();
    this.redirectCountdown = 3;
    this.countdownInterval = setInterval(() => {
      this.redirectCountdown--;
      if (this.redirectCountdown <= 0) {
        this.cancelRedirect();
        this.navigateToVisite();
      }
    }, 1000);
  }

  cancelRedirect(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  navigateToVisite(): void {
    this.cancelRedirect();
    if ((window as any).ShellRouter) {
      (window as any).ShellRouter.navigate('/visite');
    } else {
      this.router.navigate(['/visite']);
    }
  }

  activeMuseumIndex: number = 0;

  prevSlide(): void {
    if (this.museums.length === 0) return;
    this.activeMuseumIndex = (this.activeMuseumIndex - 1 + this.museums.length) % this.museums.length;
  }

  nextSlide(): void {
    if (this.museums.length === 0) return;
    this.activeMuseumIndex = (this.activeMuseumIndex + 1) % this.museums.length;
  }

  goToSlide(index: number): void {
    this.activeMuseumIndex = index;
  }

  isPrevSlide(index: number): boolean {
    if (this.museums.length <= 1) return false;
    const prevIdx = (this.activeMuseumIndex - 1 + this.museums.length) % this.museums.length;
    return index === prevIdx;
  }

  isNextSlide(index: number): boolean {
    if (this.museums.length <= 1) return false;
    const nextIdx = (this.activeMuseumIndex + 1) % this.museums.length;
    return index === nextIdx;
  }

  isSlideVisible(index: number): boolean {
    if (this.museums.length <= 3) return true;
    return index === this.activeMuseumIndex || this.isPrevSlide(index) || this.isNextSlide(index);
  }

  loadMuseums(): void {
    this.loadingMuseums = true;
    this.museumService.getAllMuseums().subscribe({
      next: (data) => {
        this.museums = data || [];
        this.loadingMuseums = false;
      },
      error: (err) => {
        console.error('Errore nel caricamento musei per la home page:', err);
        this.loadingMuseums = false;
      }
    });
  }

  getMuseumMetaUrl(museum: any): string {
    if (museum.images && museum.images.length > 0) {
      return museum.images[0];
    }
    return `/assets/museums/${museum._id || museum.id}/meta/${museum._id || museum.id}_1.webp`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/images/Gamberone.jpeg';
  }
}
