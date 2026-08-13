import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { UserResponse, AuthResponse, LoginRequest, UserRequest } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly ACCESS_TOKEN_KEY = 'artaround_accessToken';
  private readonly http = inject(HttpClient);

  private readonly _currentUser = signal<UserResponse | null>(null);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() != null);

  register(userData: UserRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, userData).pipe(
      tap(response => {
        this._currentUser.set(response.user);
        localStorage.setItem(this.ACCESS_TOKEN_KEY, response.accessToken);
      })
    );
  }







  /*
  // --- Reactive Signals State ---
  readonly currentUser = signal<UserResponse | null>(null);
  readonly accessToken = signal<string | null>(localStorage.getItem(this.ACCESS_TOKEN_KEY));

  // Computed signals
  readonly isLoggedIn = computed(() => !!this.accessToken());
  readonly userRole = computed(() => this.currentUser()?.role || 'guest');
  readonly isPendingApproval = computed(() => this.currentUser()?.roleStatus === 'pending');
  readonly userDisplayName = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    if (user.name) {
      return user.surname ? `${user.name} ${user.surname}` : user.name;
    }
    return user.email || 'Utente';
  });

  constructor(
    private router: Router
  ) {
    // Tenta di caricare il profilo o ripristinare la sessione tramite cookie all'avvio dell'app
    if (this.accessToken()) {
      this.loadCurrentUser().subscribe({
        error: () => {
          this.refreshToken().subscribe({
            error: () => this.handleSessionExpired()
          });
        }
      });
    } else {
      this.refreshToken().subscribe({
        error: () => this.handleSessionExpired()
      });
    }
  }

  login(credentialsOrEmail: LoginRequest | string, password?: string): Observable<AuthResponse> {
    const payload: LoginRequest = typeof credentialsOrEmail === 'string'
      ? { email: credentialsOrEmail, password: password || '' }
      : credentialsOrEmail;

    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload, { withCredentials: true }).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, {}, { withCredentials: true }).pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(err => {
        this.handleSessionExpired();
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      catchError(() => of(null)) // Ignora eventuali errori di logout lato server
    ).subscribe(() => {
      this.handleSessionExpired();
      this.router.navigate(['/login']);
    });
  }

  loadCurrentUser(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/me`).pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  updatePreferences(preferences: Record<string, string>): Observable<{ message: string; user: UserResponse }> {
    return this.http.put<{ message: string; user: UserResponse }>(`${this.apiUrl}/preferences`, { preferences }).pipe(
      tap(res => this.currentUser.set(res.user))
    );
  }

  requestRoleUpgrade(requestedRole: 'teacher' | 'museumstaff'): Observable<any> {
    return this.http.post(`${this.apiUrl}/request-role`, { requestedRole }).pipe(
      tap(() => this.loadCurrentUser().subscribe())
    );
  }

  loginWithGoogle(): void {
    window.location.href = `${this.apiUrl}/google`;
  }

  hasRole(...allowedRoles: string[]): boolean {
    const role = this.userRole();
    return allowedRoles.includes(role);
  }

  getAccessToken(): string | null {
    return this.accessToken();
  }

  // --- Helper Privati ---

  private handleAuthSuccess(response: AuthResponse): void {
    this.saveAccessToken(response.accessToken);
    if (response.user) {
      this.currentUser.set(response.user);
    } else {
      this.loadCurrentUser().subscribe();
    }
    if ((window as any).ShellStore) {
      (window as any).ShellStore.set('token', response.accessToken);
      (window as any).ShellStore.set('user', response.user || this.currentUser());
    }
  }

  private saveAccessToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
    this.accessToken.set(token);
  }

  private handleSessionExpired(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    this.accessToken.set(null);
    this.currentUser.set(null);
    if ((window as any).ShellStore) {
      (window as any).ShellStore.set('token', null);
      (window as any).ShellStore.set('user', null);
    }
  }
  */
}
