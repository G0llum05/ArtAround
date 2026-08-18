import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, retry } from 'rxjs';
import {
  MuseumResponse,
  MuseumRequest,
  MuseumHomePresentationResponse,
  MuseumVisitPlanResponse
} from '../models/museum.model';
import { VisitHomePresentationResponse, VisitResponse } from '../models/visit.model';
import { ArtworkForPresentation } from '../models/artwork.model';

@Injectable({
  providedIn: 'root'
})
export class MuseumService {
  private readonly apiUrl = 'http://localhost:8000/api/museum';
  http = inject(HttpClient);

  getAll(): Observable<MuseumResponse[]> {
    return this.http.get<MuseumResponse[]>(`${this.apiUrl}`);
  }

  getMuseumHomePresentation(): Observable<MuseumHomePresentationResponse[]> {
    return this.http.get<MuseumHomePresentationResponse[]>(`${this.apiUrl}/homePresentation`);
  }

  getById(id: string): Observable<MuseumResponse> {
    return this.http.get<MuseumResponse>(`${this.apiUrl}${id}`);
  }

  getAllMuseumVisits(id: string): Observable<VisitHomePresentationResponse[]> {
    return this.http.get<VisitHomePresentationResponse[]>(`${this.apiUrl}${id}/visits`);
  }
  
  getAllMuseumArtworks(id: string): Observable<ArtworkForPresentation[]> {
    return this.http.get<ArtworkForPresentation[]>(`${this.apiUrl}${id}/artworks`);
  }
  

  getVisitPlanInfoById(id: string): Observable<MuseumVisitPlanResponse> {
    return this.http.get<MuseumVisitPlanResponse>(`${this.apiUrl}${id}/visitPlan`);
  }

  create(museum: MuseumRequest): Observable<MuseumResponse> {
    return this.http.post<MuseumResponse>(`${this.apiUrl}`, museum);
  }

  updateById(id: string, museumUpdates: MuseumRequest): Observable<MuseumResponse> {
    return this.http.put<MuseumResponse>(`${this.apiUrl}${id}`, museumUpdates);
  }

  deleteById(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}`);
  }


}
