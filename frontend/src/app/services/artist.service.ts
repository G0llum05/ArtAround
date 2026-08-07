import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArtistService {
  private apiUrl = 'http://localhost:8000/api/artist';

  constructor(private http: HttpClient) {}

  getAllArtists(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createArtist(artistData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, artistData);
  }
}
