import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError, EMPTY } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error) => {
      if (error.status === 404) {
        console.warn(`Chiamata a ${req.url} fallita con 404. Errore bloccato.`);
        return EMPTY; // EMPTY chiude il flusso senza mandare in errore il componente
      }

      return throwError(() => error);
    })
  );
};
