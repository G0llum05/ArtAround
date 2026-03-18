import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/auth';

  constructor(private http: HttpClient) {}

  // 1. Login classico (Email/Password)
  login(mail: string, password: string) {
    return this.http.post<{token: string, message: string}>(`${this.apiUrl}/login`, { mail, password })
      .pipe(
        tap(response => this.saveToken(response.token))
      );
  }

  // 2. Login con Google
  // Non serve una chiamata HTTP di Angular, ma un redirect vero e proprio del browser
  loginWithGoogle() {
    window.location.href = `${this.apiUrl}/google`;
  }

  // Utility per il Token
  saveToken(token: string) {
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  logout() {
    localStorage.removeItem('auth_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
