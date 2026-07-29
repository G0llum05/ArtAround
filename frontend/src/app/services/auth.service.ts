import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { UserResponse, AuthResponse, LoginRequest, UserRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = '/api/auth';
  private readonly ACCESS_TOKEN_KEY = 'artaround_accessToken';

  // --- Reactive Signals State ---
  readonly currentUser = signal<UserResponse | null>(null);
  readonly accessToken = signal<string | null>(localStorage.getItem(this.ACCESS_TOKEN_KEY));

  // Computed signals
  readonly isLoggedIn = computed(() => !!this.accessToken());
  readonly userRole = computed(() => this.currentUser()?.role || 'guest');
  readonly isPendingApproval = computed(() => this.currentUser()?.roleStatus === 'pending');

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Se è presente un access token salvato, tenta di caricare il profilo utente all'avvio dell'app
    if (this.accessToken()) {
      this.loadCurrentUser().subscribe({
        error: () => this.handleSessionExpired()
      });
    }
  }

  /**
   * Login Locale (Email & Password oppure LoginRequest).
   */
  login(credentialsOrEmail: LoginRequest | string, password?: string): Observable<AuthResponse> {
    const payload: LoginRequest = typeof credentialsOrEmail === 'string'
      ? { email: credentialsOrEmail, password: password || '' }
      : credentialsOrEmail;

    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload, { withCredentials: true }).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  /**
   * Registrazione Locale.
   */
  register(userData: UserRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData, { withCredentials: true }).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  /**
   * Rinnovo trasparente del token tramite Cookie HttpOnly.
   */
  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, {}, { withCredentials: true }).pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(err => {
        this.handleSessionExpired();
        return throwError(() => err);
      })
    );
  }

  /**
   * Logout dell'utente. Revoca la sessione lato server e cancella lo stato locale.
   */
  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      catchError(() => of(null)) // Ignora eventuali errori di logout lato server
    ).subscribe(() => {
      this.handleSessionExpired();
      this.router.navigate(['/login']);
    });
  }

  /**
   * Carica le informazioni sanificate dell'utente attualmente autenticato.
   */
  loadCurrentUser(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/me`).pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  /**
   * Aggiorna le preferenze dell'utente (es. lingua, notifiche, accessibilità).
   */
  updatePreferences(preferences: Record<string, string>): Observable<{ message: string; user: UserResponse }> {
    return this.http.put<{ message: string; user: UserResponse }>(`${this.apiUrl}/preferences`, { preferences }).pipe(
      tap(res => this.currentUser.set(res.user))
    );
  }

  /**
   * Invia una richiesta di cambio ruolo (teacher / museumstaff).
   */
  requestRoleUpgrade(requestedRole: 'teacher' | 'museumstaff'): Observable<any> {
    return this.http.post(`${this.apiUrl}/request-role`, { requestedRole }).pipe(
      tap(() => this.loadCurrentUser().subscribe())
    );
  }

  /**
   * Avvia il flusso di login con Google tramite reindirizzamento del browser.
   */
  loginWithGoogle(): void {
    window.location.href = `${this.apiUrl}/google`;
  }

  /**
   * Verifica se l'utente possiede uno dei ruoli specificati.
   */
  hasRole(...allowedRoles: string[]): boolean {
    const role = this.userRole();
    return allowedRoles.includes(role);
  }

  /**
   * Restituisce l'Access Token corrente.
   */
  getAccessToken(): string | null {
    return this.accessToken();
  }

  // --- Helper Privati ---

  private handleAuthSuccess(response: AuthResponse): void {
    this.saveAccessToken(response.accessToken);
    this.currentUser.set(response.user);
  }

  private saveAccessToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
    this.accessToken.set(token);
  }

  private handleSessionExpired(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    this.accessToken.set(null);
    this.currentUser.set(null);
  }
}
