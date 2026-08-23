import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Guardia di Navigazione RoleGuard.
 * Consente l'accesso a una rotta solo agli utenti in possesso di uno dei ruoli autorizzati.
 *
 * Esempio di utilizzo in app.routes.ts:
 * { path: 'museum-dashboard', component: MuseumDashboardComponent, canActivate: [roleGuard('museumstaff', 'admin')] }
 */
export const roleGuard = (...allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }

    if (authService.hasRole(...allowedRoles)) {
      return true;
    }

    // Se l'utente è autenticato ma non possiede il ruolo richiesto
    return router.createUrlTree(['/unauthorized']);
  };
};
