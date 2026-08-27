import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private readonly apiUrl = `${environment.apiUrl}/groupvisit`;
  private readonly http = inject(HttpClient);

  /**
   * Crea una nuova sessione di visita di gruppo (Teacher / Admin)
   */
  createSession(payload: { visitId: string; title?: string; settings?: any }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, payload);
  }

  /**
   * Effettua l'accesso di uno studente a una sessione tramite codice PIN
   */
  joinSession(sessionCode: string): Observable<any> {
    const cleanCode = sessionCode.toUpperCase().trim();
    return this.http.post<any>(`${this.apiUrl}/join`, { sessionCode: cleanCode });
  }

  /**
   * Notifica l'uscita dello studente dalla sessione
   */
  leaveSession(sessionCode: string): Observable<any> {
    const cleanCode = sessionCode.toUpperCase().trim();
    return this.http.post<any>(`${this.apiUrl}/leave`, { sessionCode: cleanCode });
  }

  /**
   * Cerca una sessione attiva tramite codice PIN
   */
  getSessionByCode(code: string): Observable<any> {
    const cleanCode = code.toUpperCase().trim();
    return this.http.get<any>(`${this.apiUrl}/code/${cleanCode}`);
  }

  /**
   * Recupera i dettagli di una sessione tramite ID
   */
  getSessionById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
}
