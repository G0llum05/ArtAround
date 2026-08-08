import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArtworkService {
  private apiUrl = 'http://localhost:8000/api/artwork';

  constructor(private http: HttpClient) {}

  getAllArtworks(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getArtworkById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createArtwork(artworkData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, artworkData);
  }

  updateArtwork(id: string, artworkData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, artworkData);
  }

  deleteArtwork(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
