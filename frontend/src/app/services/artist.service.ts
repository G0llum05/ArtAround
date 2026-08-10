import { ArtistResponse, ArtistRequest } from "../models/artist.model";
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// import { tap, catchError } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class ArtistService {
    private readonly apiUrl = '/api/artist/';

    constructor(
        private http: HttpClient,
    ) {}

    getAll(): Observable<ArtistResponse[]> {
        return this.http.get<ArtistResponse[]>(`{this.apiUrl}`);
    }

    getById(id: string): Observable<ArtistResponse> {
        return this.http.get<ArtistResponse>(`${this.apiUrl}${id}`);
    }

    create(artist: ArtistRequest): Observable<ArtistResponse> {
        return this.http.post<ArtistResponse>(`${this.apiUrl}`, artist);
    }

    updateById(id: string, artistUpdates: ArtistRequest) {
        return this.http.put<ArtistResponse>(`${this.apiUrl}${id}`, artistUpdates);
    }

    deleteById(id: string) {
        return this.http.delete<void>(`${this.apiUrl}${id}`);
    }
}

