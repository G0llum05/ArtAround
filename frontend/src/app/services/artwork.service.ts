import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ArtworkResponse, ArtworkRequest } from '../models/artwork.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ArtworkService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/artwork`;

  getAll(): Observable<ArtworkResponse[]> {
    return this.http.get<ArtworkResponse[]>(`${this.apiUrl}`);
  }

  getById(id: string): Observable<ArtworkResponse> {
    return this.http.get<ArtworkResponse>(`${this.apiUrl}/${id}`);
  }

  create(artwork: ArtworkRequest): Observable<ArtworkResponse> {
    return this.http.post<ArtworkResponse>(`${this.apiUrl}`, artwork);
  }

  updateById(id: string, artworkUpdates: ArtworkRequest): Observable<ArtworkResponse> {
    return this.http.put<ArtworkResponse>(`${this.apiUrl}/${id}`, artworkUpdates);
  }

  deleteById(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}