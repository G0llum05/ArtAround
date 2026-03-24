import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OperaService {
  private apiUrl = 'http://localhost:8000/api/opera';

  constructor(private http: HttpClient) {}

  getAllOperas(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getOperaById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createOpera(operaData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, operaData);
  }

  updateOpera(id: string, operaData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, operaData);
  }

  deleteOpera(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
