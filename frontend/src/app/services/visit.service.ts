import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VisitResponse, VisitRequest, VisitHomePresentationResponse } from '../models/visit.model';
import { MuseumHomePresentationResponse, MuseumResponse } from '../models/museum.model';

@Injectable({
    providedIn: 'root'
})
export class VisitService {
    private readonly apiUrl = '/api/visit/';

    constructor(private http: HttpClient) {}
    
    getAll(): Observable<VisitResponse[]> {
        return this.http.get<VisitResponse[]>(`${this.apiUrl}`);
    }

    getMarketPlaceFeed(): Observable<VisitResponse[]> {
        return this.http.get<VisitResponse[]>(`${this.apiUrl}feed`);
    }

    getLikesById(id: string): Observable<number> {
        return this.http.get<number>(`${this.apiUrl}${id}/like`);
    }

    getViewsById(id: string): Observable<number> {
        return this.http.get<number>(`${this.apiUrl}${id}/view`);
    }

    getArtworkImagesById(id: string): Observable<string[]> {
        return this.http.get<string[]>(`${this.apiUrl}${id}/artwork-images`);
    }
    
    getArtistImagesById(id: string): Observable<string[]> {
        return this.http.get<string[]>(`${this.apiUrl}${id}/arist-images`);
    }

    getHomePresentation(museumId: string, visitId: string): Observable<VisitHomePresentationResponse> {
        return this.http.get<VisitHomePresentationResponse>(`${this.apiUrl}${museumId}/visit/${visitId}/home-presentation`);
    }

    create(visit: VisitRequest) {
        return this.http.post<MuseumResponse>(`${this.apiUrl}`, visit);
    }

    
    
    
}