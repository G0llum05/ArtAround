import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { BehaviorSubject, catchError, switchMap, throwError, take,  filter } from 'rxjs';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  // Assicuriamo withCredentials per gli endpoint di auth (per permettere l'invio del Cookie HttpOnly)
  // const isAuthReq = req.url.includes('/api/auth');
  const isRefreshReq = req.url.includes('/api/auth/refresh');
  const isLoginReq = req.url.includes('/api/auth/login');

  const addAuthHeader = (request: HttpRequest<any>, tokenVal: string | null) => {
    const headers: Record<string, string> = {}
    if (tokenVal && !isRefreshReq) {
      headers['Authorization'] = `Bearer ${tokenVal}`;
    }
    return request
    .clone(
      {
        setHeaders: headers,
        withCredentials: true
      }
    );
  }

  const reqCloned = addAuthHeader(req, token);

  // Eseguiamo la richiesta ed intercettiamo l'eventuale errore 401 Unauthorized
  return next(reqCloned)
  .pipe(
    catchError((error: HttpErrorResponse) => {
      // Se l'errore è 401 e non stiamo già effettuando una chiamata di login o refresh
      if ((error.status === 401) && !isRefreshReq && !isLoginReq) {
        if (!token && !authService.getAccessToken()) {
          return throwError(() => error);
        }

        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refreshToken()
          .pipe(
            switchMap((response) => {
              isRefreshing = false;
              refreshTokenSubject.next(response.accessToken);
              return next(addAuthHeader(req, response.accessToken));
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              refreshTokenSubject.next(null);
              authService.logout().subscribe({ error: () => {} });
              return throwError(() => refreshError);
            })
          );
        } else {
          // Se il refresh è già in corso, le altre richieste attendono che arrivi il nuovo token
          return refreshTokenSubject.pipe(
            filter((newToken) => newToken !== null),
            take(1),
            switchMap((newToken) => next(addAuthHeader(req, newToken)))
          );
        }
      }

      return throwError(() => error);
    })
  );
};