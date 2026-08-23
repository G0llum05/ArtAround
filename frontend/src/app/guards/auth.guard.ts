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

  // Se l'utente non è autenticato, reindirizza alla pagina di login salvando la rotta di destinazione
  try {                                                                                                                                                                               
    await firstValueFrom(authService.refreshToken());                                                                                                                                 
    return true;                                                                                                                                                                      
  } catch {                                                                                                                                                                           
    // In caso di errore/scadenza, reindirizza restituendo direttamente l'UrlTree                                                                                                  
    return router.createUrlTree(['/login'], {                                                                                                                                         
      queryParams: { returnUrl: state.url }                                                                                                                                           
    });                                                                                                                                                                               
  } 

};
