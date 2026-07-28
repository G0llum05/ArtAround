import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkActive, RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterLinkActive,
    RouterLink,
  ],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.css'
})
export class ToolbarComponent implements OnInit, OnDestroy {
  private _sub: any;

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  get isAngular() {
    return !!document.querySelector('app-root');
  }

  ngOnInit() {
    // Forza il ricalcolo quando la rotta cambia (utile per sincronizzare Angular e Vanilla)
    this._sub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.cdr.detectChanges();
    });

    if ((window as any).ShellStore) {
      (window as any).ShellStore.on('currentPath', () => {
        this.cdr.detectChanges(); // Forza il ricalcolo di isActive() nel template
      });
    }

    // Ascolta anche popstate manuali per il marketplace
    window.addEventListener('popstate', this.onPopState);
  }

  ngOnDestroy() {
    if (this._sub) this._sub.unsubscribe();
    window.removeEventListener('popstate', this.onPopState);
  }

  onPopState = () => {
    this.cdr.detectChanges();
  }

  isActive(path: string): boolean {
    const currentPath = window.location.pathname;
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  }

  navItems = [
    { label: 'Home',        path: '/'            },
    { label: 'Visite',      path: '/visite'      },
    { label: 'Contatti',    path: '/contatti'    },
    { label: 'Test', path: '/test'}
  ] as const;
}
