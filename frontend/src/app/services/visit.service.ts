import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VisitService {
  private apiUrl = 'http://localhost:8000/api/visit';

  constructor(private http: HttpClient) {}

  getAllVisits(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getVisitArtworkImages(visitId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${visitId}/artwork-images`);
  }

  createVisit(visitData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, visitData);
  }
}
