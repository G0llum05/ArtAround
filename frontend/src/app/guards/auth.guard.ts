import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';

/**
 * Guardia di Navigazione AuthGuard.
 * Protegge le rotte riservate agli utenti autenticati.
*/

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  if (authService.getAccessToken()) {
    try {
      await firstValueFrom(authService.refreshToken());
      return true;
    } catch {
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
    }
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  }); 

};
