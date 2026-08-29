import { Component, effect, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-high-contrast-toggle',
  standalone: true,
  template: `
    <button (click)="toggleContrast()" class="icon-btn" [title]="isHighContrast() ? 'Disattiva Alto Contrasto' : 'Attiva Alto Contrasto'">
      <!-- Icona Cerchio a metà (simbolo tipico del contrasto) -->
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 2a10 10 0 0 0 0 20z" fill="currentColor"></path>
      </svg>

      <!-- Se vuoi un feedback visivo sul bottone quando è attivo, puoi aggiungere un indicatore -->
      @if (isHighContrast()) {
        <span class="active-dot"></span>
      }
    </button>
  `,
  styles: [`
    .icon-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: var(--spacing-xs);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-full);
      transition: background-color 0.2s ease;
      position: relative;
    }
    .icon-btn:hover {
      background-color: var(--surface-variant);
    }
    .icon {
      color: var(--on-surface);
      width: 1.4rem;
      height: 1.4rem;
    }
    .active-dot {
      position: absolute;
      top: 0;
      right: 0;
      width: 8px;
      height: 8px;
      background-color: var(--primary);
      border-radius: 50%;
    }
  `]
})
export class HighContrastToggle {
  private platformId = inject(PLATFORM_ID);
  isHighContrast = signal<boolean>(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('high-contrast') === 'true';
      this.isHighContrast.set(saved);
    }

    // Effetto reattivo che aggiunge o rimuove la classe 'high-contrast' al tag <html>
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        const isHc = this.isHighContrast();
        if (isHc) {
          document.documentElement.classList.add('high-contrast');
        } else {
          document.documentElement.classList.remove('high-contrast');
        }
        localStorage.setItem('high-contrast', isHc.toString());
      }
    });
  }

  toggleContrast() {
    this.isHighContrast.update(val => !val);
  }
}
