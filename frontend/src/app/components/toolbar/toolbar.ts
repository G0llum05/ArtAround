import { Component } from '@angular/core';
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
  navItems = [
    { label: 'Home',        path: '/'            },
    { label: 'Visite',      path: '/visite'      },
    { label: 'Contatti',    path: '/contatti'    },
  ] as const;
}
