import { Component, ChangeDetectorRef, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkActive, RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';

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
  public authService = inject(AuthService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private _sub: any;

  constructor() {
    effect(() => {
      // Monitora i Signal dell'auth per aggiornare la grafica del Web Component
      this.authService.isLoggedIn();
      this.authService.currentUser();
      this.authService.userDisplayName();
      this.cdr.detectChanges();
    });
  }

  get isAngular() {
    return !!document.querySelector('app-root');
  }

  isAdmin(): boolean {
    return this.authService.isLoggedIn() && this.authService.hasRole('admin');
  }

  onNavClick(event: Event, path: string): void {
    if (path.startsWith('/marketplace/museums')) {
      if (!this.authService.isLoggedIn()) {
        event.preventDefault();
        this.alertService.error('Accesso negato: Devi effettuare il login per accedere alla sezione Musei.');
        if ((window as any).ShellRouter) {
          (window as any).ShellRouter.navigate('/login?returnUrl=' + encodeURIComponent(path));
        } else {
          this.router.navigate(['/login'], { queryParams: { returnUrl: path } });
        }
        return;
      }

      if (!this.authService.hasRole('admin')) {
        event.preventDefault();
        this.alertService.error('Accesso negato: La sezione Musei è riservata esclusivamente agli utenti Amministratori (admin).');
        return;
      }
    }
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
      (window as any).ShellStore.on('user', () => {
        this.cdr.detectChanges();
      });
      (window as any).ShellStore.on('token', () => {
        this.cdr.detectChanges();
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
    if (path === '/marketplace') return currentPath === '/marketplace' || currentPath === '/marketplace/';
    return currentPath === path || currentPath.startsWith(path + '/');
  }

  onLogout(): void {
    this.authService.logout();
    this.cdr.detectChanges();
  }

  navItems = [
    { label: 'Home',        path: '/'            },
    { label: 'Musei',       path: '/marketplace/museums' },
    { label: 'Visite',      path: '/visite'      },
    { label: 'Contatti',    path: '/contatti'    },
    { label: 'Test',        path: '/test'        }
  ] as const;
}
