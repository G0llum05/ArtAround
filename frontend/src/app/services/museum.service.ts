import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
    MuseumResponse,
    MuseumRequest,
    MuseumHomePresentationResponse,
    MuseumVisitPlanResponse
} from '../models/museum.model';
import { VisitResponse } from '../models/visit.model';

@Injectable({
    providedIn: 'root'
})
export class MuseumService {
    private readonly apiUrl = '/api/museum/';

    constructor(private http: HttpClient) {}

    getAll(): Observable<MuseumResponse[]> {
        return this.http.get<MuseumResponse[]>(`${this.apiUrl}`);
    }

    getById(id: string): Observable<MuseumResponse> {
        return this.http.get<MuseumResponse>(`${this.apiUrl}${id}`);
    }

    getVisitsById(id: string): Observable<VisitResponse[]> {
        return this.http.get<VisitResponse[]>(`${this.apiUrl}${id}`);
    }

    getVisitPlanInfoById(id: string): Observable<MuseumVisitPlanResponse> {
        return this.http.get<MuseumVisitPlanResponse>(`${this.apiUrl}${id}/visitPlan`);
    }
    
    getVisitHomePresentationById(id: string): Observable<MuseumHomePresentationResponse> {
        return this.http.get<MuseumHomePresentationResponse>(`${this.apiUrl}${id}/homePresentation`);
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