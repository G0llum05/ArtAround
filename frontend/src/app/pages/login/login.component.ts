import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  isLoginMode = true; // Default: Accedi
  email = '';
  password = '';
  name = '';
  surname = '';

  errorMessage = '';
  successMessage = '';
  isLoading = false;

  private returnUrl: string = '/';

  constructor(
    public authService: AuthService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    this.route.queryParams.subscribe(params => {
      if (params['status'] === 'success') {
        this.isLoading = true;
        this.authService.refreshToken().subscribe({
          next: () => {
            this.isLoading = false;
            this.setSuccessMessage('Login con Google effettuato con successo!');
            this.cdr.detectChanges();
            this.router.navigateByUrl(this.returnUrl);
          },
          error: () => {
            this.isLoading = false;
            this.setSuccessMessage('Login con Google effettuato con successo!');
            this.cdr.detectChanges();
            this.router.navigateByUrl(this.returnUrl);
          }
        });
      } else if (params['error'] === 'oauth_error' || params['error'] === 'google') {
        this.setErrorMessage('Autenticazione con Google fallita o annullata.');
      } else if (params['error'] === 'auth_failed') {
        this.setErrorMessage('Impossibile autenticare l\'utente.');
      }
    });
  }

  onLogout(): void {
    this.authService.logout();
    this.clearMessages();
    this.cdr.detectChanges();
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.clearMessages();
    this.password = '';
    this.name = '';
    this.surname = '';
    this.cdr.detectChanges();
  }

  setMode(loginMode: boolean): void {
    if (this.isLoginMode !== loginMode) {
      this.isLoginMode = loginMode;
      this.clearMessages();
      this.password = '';
      this.name = '';
      this.surname = '';
      this.cdr.detectChanges();
    }
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();
  }

  setErrorMessage(msg: string): void {
    this.errorMessage = msg;
    this.successMessage = '';
    this.alertService.error(msg);
    this.cdr.detectChanges();
  }

  setSuccessMessage(msg: string): void {
    this.successMessage = msg;
    this.errorMessage = '';
    this.alertService.success(msg);
    this.cdr.detectChanges();
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  onSubmit(): void {
    this.clearMessages();

    if (this.authService.isLoggedIn()) {
      this.setErrorMessage('Sei già autenticato! Devi prima effettuare il logout per accedere con un altro account.');
      return;
    }

    if (this.isLoginMode) {
      // --- LOGICA LOGIN ---
      if (!this.email || !this.password) {
        this.setErrorMessage('Inserisci sia l\'email che la password.');
        return;
      }

      if (!this.isValidEmail(this.email.trim())) {
        this.setErrorMessage('Inserisci un indirizzo email valido (es. nome@esempio.it).');
        return;
      }

      this.isLoading = true;
      this.cdr.detectChanges();

      this.authService.login(this.email, this.password).subscribe({
        next: () => {
          this.isLoading = false;
          this.setSuccessMessage('Login effettuato con successo!');
          this.cdr.detectChanges();
          this.router.navigateByUrl(this.returnUrl);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Errore di login:', err);
          const msg = (err.error && err.error.message) ? err.error.message : 'Email o password errate!';
          this.setErrorMessage(msg);
          this.cdr.detectChanges();
        }
      });

    } else {
      // --- LOGICA REGISTRAZIONE ---
      if (!this.email || !this.password || !this.name || !this.surname) {
        this.setErrorMessage('Tutti i campi (Nome, Cognome, Email, Password) sono obbligatori.');
        return;
      }

      if (!this.isValidEmail(this.email.trim())) {
        this.setErrorMessage('Inserisci un indirizzo email valido (es. nome@esempio.it).');
        return;
      }

      const userData = {
        name: this.name.trim(),
        surname: this.surname.trim(),
        email: this.email.trim(),
        password: this.password
      };

      this.isLoading = true;
      this.cdr.detectChanges();

      this.authService.register(userData).subscribe({
        next: () => {
          this.isLoading = false;
          this.setSuccessMessage('Registrazione completata con successo! Benvenuto su ArtAround.');
          this.cdr.detectChanges();
          // La registrazione nel backend autentica già l'utente e genera il token: reindirizza alla home!
          this.router.navigateByUrl(this.returnUrl);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Errore di registrazione:', err);
          let msg = 'Si è verificato un errore durante la registrazione.';
          if (err.error && err.error.message) {
            msg = err.error.message;
          } else if (err.status === 400) {
            msg = 'Un utente con questa email risulta già registrato.';
          }
          this.setErrorMessage(msg);
          this.cdr.detectChanges();
        }
      });
    }
  }

  onGoogleLogin(): void {
    if (this.authService.isLoggedIn()) {
      this.setErrorMessage('Sei già autenticato! Devi prima effettuare il logout per accedere con un altro account.');
      return;
    }
    this.authService.loginWithGoogle();
  }
}
