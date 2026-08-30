import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Quiz } from '../models/quiz.model';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private readonly apiUrl = `${environment.apiUrl}/quiz`;
  private readonly http = inject(HttpClient);

  /**
   * Genera un nuovo quiz con AI per la visita
   */
  generateQuiz(payload: {
    visitId: string;
    numberOfQuestions?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    targetAge?: 'bambino' | 'studente' | 'adulto' | 'specialista';
    language?: string;
  }): Observable<{ type: string; message: string; data: Quiz }> {
    return this.http.post<{ type: string; message: string; data: Quiz }>(`${this.apiUrl}/generate`, payload);
  }

  /**
   * Crea un quiz manuale personalizzato
   */
  createCustomQuiz(payload: {
    visitId: string;
    title: string;
    description?: string;
    questions: any[];
    difficulty?: string;
    targetAge?: string;
    language?: string;
  }): Observable<{ type: string; message: string; data: Quiz }> {
    return this.http.post<{ type: string; message: string; data: Quiz }>(`${this.apiUrl}`, payload);
  }

  /**
   * Ottiene i quiz disponibili per una visita
   */
  getQuizzesByVisit(visitId: string): Observable<{ type: string; data: Quiz[] }> {
    return this.http.get<{ type: string; data: Quiz[] }>(`${this.apiUrl}/visit/${visitId}`);
  }

  /**
   * Ottiene un quiz per ID
   */
  getQuizById(quizId: string, includeAnswers = true): Observable<{ type: string; data: Quiz }> {
    const params = new HttpParams().set('includeAnswers', includeAnswers ? 'true' : 'false');
    return this.http.get<{ type: string; data: Quiz }>(`${this.apiUrl}/${quizId}`, { params });
  }

  /**
   * Elimina un quiz
   */
  deleteQuiz(quizId: string): Observable<{ type: string; message: string }> {
    return this.http.delete<{ type: string; message: string }>(`${this.apiUrl}/${quizId}`);
  }
}
