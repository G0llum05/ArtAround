import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private readonly apiUrl = `${environment.apiUrl}/upload`;
  private readonly http = inject(HttpClient);

  /**
   * Carica la foto profilo dell'utente
   */
  uploadUserPropic(userId: string, file: File, orientation?: string): Observable<{ message: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    if (orientation) {
      formData.append('orientation', orientation);
    }
    return this.http.post<{ message: string; url: string }>(`${this.apiUrl}/user/${userId}/propic`, formData);
  }

  /**
   * Recupera l'URL della foto profilo di un utente
   */
  getUserPropic(userId: string): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.apiUrl}/user/${userId}/propic`);
  }
}
