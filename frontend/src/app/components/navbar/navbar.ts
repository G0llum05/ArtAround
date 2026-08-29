import { Component, inject, signal, computed, effect } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeToggleComponent } from '../theme-toggle/themeToggleButton';
import { AuthService } from '../../services/auth.service';
import { QrScanner } from '../qr-scanner/qr-scanner';
import { HighContrastToggle } from '../high-contrast-toggle/high-contrast-toggle';
import { LanguageSelector } from '../language-selector/language-selector';

interface Entry{
  name: string;
  path: string;
}

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLinkActive,
    RouterLink,
    CommonModule,
    ThemeToggleComponent,
    QrScanner,
    HighContrastToggle,
    LanguageSelector,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  protected authService = inject(AuthService);
  protected router = inject(Router);

  isMenuOpen = signal<boolean>(false);
  hasImageError = signal<boolean>(false);
  isScannerOpen = signal<boolean>(false);

  profilePictureUrl = computed(() => {
    if (this.hasImageError()) {
      return null;
    }
    const user = this.authService.currentUser();
    const url = user?.assets?.profilePicture?.url;
    if (!url || url.includes('default.jpeg')) {
      return null;
    }
    return url;
  });

  constructor() {
    effect(() => {
      this.authService.currentUser();
      this.hasImageError.set(false);
    });
  }

  toggleMenu() {
    this.isMenuOpen.update((val) => !val);
  }

  onImageError() {
    this.hasImageError.set(true);
  }

  navItems: Entry[] = [
    { name: 'Home', path: '/' },
    { name: 'Marketplace', path: '/marketplace' },
    { name: 'Visite', path: '/marketplace/visit/search' },
    { name: 'Gruppi', path: '/groups' },
    { name: 'Contatti', path: '/contacts' },
  ];
}
