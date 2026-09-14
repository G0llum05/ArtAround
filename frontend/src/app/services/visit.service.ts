import { inject, Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VisitResponse, VisitRequest, VisitHomePresentationResponse } from '../models/visit.model';
import { MuseumHomePresentationResponse, MuseumResponse } from '../models/museum.model';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VisitService {
  private readonly apiUrl: string = `${environment.apiUrl}/visit`;
  private readonly http = inject(HttpClient);

  getAll(): Observable<VisitResponse[]> {
    return this.http.get<VisitResponse[]>(`${this.apiUrl}/`);
  }

  getMarketPlaceFeed(): Observable<VisitResponse[]> {
    return this.http.get<VisitResponse[]>(`${this.apiUrl}/feed`);
  }

  getLikesById(id: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/${id}/like`);
  }

  getViewsById(id: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/${id}/view`);
  }

  getArtworkImagesById(id: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/${id}/artwork-images`);
  }

  getArtistImagesById(id: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/${id}/arist-images`);
  }

  getHomePresentation(): Observable<VisitHomePresentationResponse[]> {
    return this.http.get<VisitHomePresentationResponse[]>(`${this.apiUrl}/homePresentation`);
  }

  getById(id: string): Observable<VisitResponse> {
    return this.http.get<VisitResponse>(`${this.apiUrl}/${id}`);
  }

  create(visit: VisitRequest) {
    return this.http.post<MuseumResponse>(`${this.apiUrl}`, visit);
  }

  getPurchasedVisits(userId: string): Observable<VisitHomePresentationResponse[]> {
    return this.http.get<VisitHomePresentationResponse[]>(`${environment.apiUrl}/user/${userId}/purchased`);
  }

  getCreatedVisits(userId: string): Observable<VisitHomePresentationResponse[]> {
    return this.http.get<VisitHomePresentationResponse[]>(`${environment.apiUrl}/user/${userId}/created`);
  }

  delete(visitId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${visitId}`);
  }
}
