import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, of, timer, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators'
import { tap, catchError } from 'rxjs/operators';
import { UserResponse, AuthResponse, LoginRequest, UserRequest } from '../models/user.model';
import { environment } from '../../environments/environment';
import { VisitHomePresentationResponse, VisitResponse } from '../models/visit.model';
import { ImageOrientation } from '../models/subModels/image.model';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly ACCESS_TOKEN_KEY = 'artaround_accessToken';
  private readonly http = inject(HttpClient);

  private readonly _currentUser = signal<AuthResponse | null>(null);
  private readonly _accessToken = signal<string | null> (localStorage.getItem(this.ACCESS_TOKEN_KEY));
  private readonly _currentVisit = signal<VisitHomePresentationResponse | null>(null);

  readonly currentUser = this._currentUser.asReadonly();
  readonly accessToken = this._accessToken.asReadonly();
  readonly currentVisit = this._currentVisit.asReadonly();

  // Computed Signals
  readonly isLoggedIn = computed(() => this.currentUser() != null);
  readonly userRole = computed(() => this.currentUser()?.role || 'guest');
  // readonly isPendingApproval = computed(() => this.currentUser()?.roleStatus === 'pending');

  readonly userDisplayName = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    if (user.name) {
      return user.surname ? `${user.name} ${user.surname}` : user.name;
    }
    return user.email || 'Utente';
  });

  constructor() {
    // Inizializzazione gestita all'avvio da provideAppInitializer in app.config.ts
  }

  private setSession(authData: AuthResponse): void {
    this._currentUser.set(authData);
    this._accessToken.set(authData.accessToken);
    localStorage.setItem(this.ACCESS_TOKEN_KEY, authData.accessToken);
    console.log("[Auth Service] sessione inizializzata con successo!")
  }

  private clearSession(): void {
    this._currentUser.set(null);
    this._accessToken.set(null);
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    console.log("[Auth Service] sessione terminata con successo!")
  }

  register(userData: UserRequest): Observable<{ message?: string; type?: 'success' | 'warning' | 'error' | string }> {
    return this.http.post<{ message?: string; type?: 'success' | 'warning' | 'error' | string }>(`${this.apiUrl}/signup`, userData);
  }

  verifyCode(email: string, code: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/verifyCode`, { email, code }, { withCredentials: true }).pipe(
      tap(response => {
        this.setSession(response);
      })
    );
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials, { withCredentials: true }).pipe(
      tap(response => {
        this.setSession(response);
      })
    );
  }

  logout(): Observable<{ message?: string; type?: 'success' | 'warning' | 'error' | string }> {
    return this.http.post<{ message?: string; type?: 'success' | 'warning' | 'error' | string }>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => this.clearSession()),
      catchError((err) => {
        this.clearSession();
        return throwError(() => err);
      })
    );
  }

  googleLogin(): void {
    window.location.href = `${this.apiUrl}/google`;
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, {}, { withCredentials: true }).pipe( // withCredentials: true per inviare i cookie che contenono il refresh token
      tap(response => {
        this.setSession(response);
      }),
      catchError(err => {
        this.clearSession();
        return throwError(() => err);
      })
    );
  }

  getAccessToken(): string | null {
    return this.accessToken() || localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  updateUserProfilePicture(url: string, orientation: ImageOrientation = 'square'): void {
    const current = this._currentUser();
    if (current) {
      const cleanUrl = url.split('?')[0];
      const cacheBustedUrl = `${cleanUrl}?t=${Date.now()}`;
      this._currentUser.set({
        ...current,
        assets: {
          ...current.assets,
          profilePicture: {
            url: cacheBustedUrl,
            orientation: orientation
          }
        }
      });
    }
  }

  // ---- Roles

  hasRole(...allowedRoles: string[]): boolean {
    const role = this.userRole();
    return allowedRoles.includes(role);
  }

  // Matti di seguito ti metto del codice che puoi eliminare ma che ti potrebbe servire per gestire le sessioni
  // un polling ("interrogazione ciclica") ti permette di fare con observables in modo figo quello che in js faresti con setIntervalTimer
  // Lo puoi far partire in seguito a un evento e rimane attivo fin che non lo termini (unsubscribe) o fino alla fine dell'applicazione
  // La funzione che ti ho messo restituisce un observables che va usato come vedi nella prima riga

  /*
  private pollingSubscription: Subscription = this.startPolling().subscribe()

  startPolling(intervalMs: number = 5000): Observable<any> {
    // timer(0, intervalMs) emette subito (dopo 0ms) e poi ogni intervalMs millisecondi
    return timer(0, intervalMs).pipe(
      // switchMap intercetta ogni "tick" del timer e lancia la chiamata HTTP,
      // annullando la precedente se non ha ancora risposto (evita sovrapposizioni)
      switchMap(() => this.http.get("test"))
    );
  }
  */


  //Andrebbe terminato così ma essendo un componente provided in root non è necessario
  /*
  ngOnDestroy(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }
   */



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
