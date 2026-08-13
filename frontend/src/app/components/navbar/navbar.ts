import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeToggleComponent } from '../themeToggle/themeToggleButton';
import { Contacts } from '../../pages/contacts/contacts';

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
  isMenuOpen = signal<boolean>(false);
  toggleMenu() {
    this.isMenuOpen.update(val => !val);
  };

  navItems: Entry[] = [
    { name: 'Home', path: '/'},
    { name: 'Visite', path: '/visit'},
    { name: 'Marketplace', path: '/marketplace'},
    { name: 'Contatti', path: '/contacts'},
    { name: 'Navigator', path: '/navigator'},
  ];
}
