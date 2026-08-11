/*
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  let reqCloned = req;

  // 1. Assicuriamo withCredentials per gli endpoint di auth (per permettere l'invio del Cookie HttpOnly)
  const isAuthReq = req.url.includes('/api/auth');
  const isRefreshReq = req.url.includes('/api/auth/refresh');
  const isLoginReq = req.url.includes('/api/auth/login');

  const headersConfig: Record<string, string> = {};

  if (token && !isRefreshReq) {
    headersConfig['Authorization'] = `Bearer ${token}`;
  }

  reqCloned = req.clone({
    setHeaders: headersConfig,
    withCredentials: true // Abilita l'invio di cookie HTTP-Only CORS per tutte le chiamate API
  });

  // 2. Eseguiamo la richiesta ed intercettiamo l'eventuale errore 401 Unauthorized
  return next(reqCloned).pipe(
    catchError((error: HttpErrorResponse) => {
      // Se l'errore è 401 e non stiamo già effettuando una chiamata di login o refresh
      if (error.status === 401 && !isRefreshReq && !isLoginReq) {
        if (!isRefreshing) {
          isRefreshing = true;

          return authService.refreshToken().pipe(
            switchMap((response) => {
              isRefreshing = false;
              // Riprova la richiesta originale fallita inserendo il nuovo Access Token
              const retriedReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${response.accessToken}`
                },
                withCredentials: true
              });
              return next(retriedReq);
            }),
            catchError((refreshErr) => {
              isRefreshing = false;
              authService.logout();
              return throwError(() => refreshErr);
            })
          );
        }
      }

      return throwError(() => error);
    })
  );
};
*/

