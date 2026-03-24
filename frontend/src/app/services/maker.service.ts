import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MakerService {
  private apiUrl = 'http://localhost:8000/api/maker';

  constructor(private http: HttpClient) {}

  getAllMakers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createMaker(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }
}
