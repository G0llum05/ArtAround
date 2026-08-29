import { Component, effect, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-theme-toggle-button',
  template: `
    <button (click)="toggleTheme()" class="icon-btn">
      @if (isDark()) {
        <svg class="icon" fill="currentColor" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
          <path d="M565-395q35-35 35-85t-35-85q-35-35-85-35t-85 35q-35 35-35 85t35 85q35 35 85 35t85-35Zm-226.5 56.5Q280-397 280-480t58.5-141.5Q397-680 480-680t141.5 58.5Q680-563 680-480t-58.5 141.5Q563-280 480-280t-141.5-58.5ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-59 96 100-52 56Zm492 496-97-101 53-55 101 97-57 59Zm-98-550 97-101 59 57-100 96-56-52ZM154-212l101-97 55 53-97 101-59-57Zm326-268Z"/>
        </svg>
      } @else {
        <svg class="icon" fill="currentColor" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
          <path d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Zm0-80q88 0 158-48.5T740-375q-20 5-40 8t-40 3q-123 0-209.5-86.5T364-660q0-20 3-40t8-40q-78 32-126.5 102T200-480q0 116 82 198t198 82Zm-10-270Z"/>
        </svg>
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
    }
    .icon-btn:hover {
      background-color: var(--surface-variant);
    }
    .icon {
      color: var(--on-surface);
      width: 1.4rem;
      height: 1.4rem;
    }
  `]
})
export class ThemeToggleComponent {
  private platformId = inject(PLATFORM_ID);
  isDark = signal<boolean>(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) { //check if the platform is a browser
      const saved = localStorage.getItem('theme') === 'dark'; //check the theme saved in the local storage
      this.isDark.set(saved);
    }

    // L'effetto reattivo di Angular aggiorna il DOM in automatico
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        const theme = this.isDark() ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
      }
    });
  }

  toggleTheme() {
    this.isDark.update(val => !val);
  }
}
