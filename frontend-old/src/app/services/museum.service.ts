import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MuseumService {
  private apiUrl = 'http://localhost:8000/api/museum';

  constructor(private http: HttpClient) {}

  getAllMuseums(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createMuseum(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }
}
