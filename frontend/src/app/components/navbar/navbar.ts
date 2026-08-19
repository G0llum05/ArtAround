import { Component, inject, signal, computed, effect } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeToggleComponent } from '../themeToggle/themeToggleButton';
import { AuthService } from '../../services/auth.service';

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
    ThemeToggleComponent
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  protected authService = inject(AuthService);

  isMenuOpen = signal<boolean>(false);
  hasImageError = signal<boolean>(false);

  profilePictureUrl = computed(() => {
    if (this.hasImageError()) {
      return null;
    }
    const user = this.authService.currentUser();
    return user?.assets?.profilePicture?.url || null;
  });

  constructor() {
    effect(() => {
      this.authService.currentUser();
      this.hasImageError.set(false);
    });
  }

  toggleMenu() {
    this.isMenuOpen.update(val => !val);
  }

  onImageError() {
    this.hasImageError.set(true);
  }

  navItems: Entry[] = [
    { name: 'Home', path: '/'},
    { name: 'Visite', path: '/marketplace/visit/search'},
    { name: 'Marketplace', path: '/marketplace'},
    { name: 'Contatti', path: '/contacts'},
    { name: 'Navigator', path: '/navigator'},
  ];
}
