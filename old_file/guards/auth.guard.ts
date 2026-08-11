/*
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../auth.service';

/**
 * Guardia di Navigazione AuthGuard.
 * Protegge le rotte riservate agli utenti autenticati.

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  // Se l'utente non è autenticato, reindirizza alla pagina di login salvando la rotta di destinazione
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
*/
