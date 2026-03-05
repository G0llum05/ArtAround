import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkActive, RouterLink } from '@angular/router';

@Component({
  selector: 'toolbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterLinkActive,
    RouterLink,
  ],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.css'
})
export class ToolbarComponent {
  isScrolled = signal(false);

  navItems = [
    { label: 'Home',        path: '/'            },
    { label: 'Marketplace', path: '/marketplace' },
    { label: 'Visite',      path: '/visite'      },
    { label: 'Contatti',    path: '/contatti'    },
  ] as const;

  @HostListener('window:scroll')
  onScroll(): void {
    if (window.scrollY > 20) {
      this.isScrolled.set(true);
    }
  }
}
