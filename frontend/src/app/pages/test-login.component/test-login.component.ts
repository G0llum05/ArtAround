import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-test-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './test-login.component.html',
  styleUrls: ['./test-login.component.css']
})
export class TestLoginComponent {
  isLoginMode = true; // Default to Sign In
  email = '';
  password = '';
  name = '';
  surname = '';
  role = 'guest'; // Default role

  constructor(private authService: AuthService, private alertService: AlertService, private router: Router) {}

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.resetFields();
  }

  resetFields() {
    this.name = '';
    this.surname = '';
    this.email = '';
    this.password = '';
    this.role = 'guest';
  }

  onSubmit() {
    if (this.isLoginMode) {
      // LOGICA LOGIN
      if (!this.email || !this.password) {
        this.alertService.error('Per favore, inserisci email e password!');
        return;
      }

      this.authService.login(this.email, this.password).subscribe({
        next: (res) => {
          console.log('Login riuscito!', res);
          this.alertService.success('Login Riscito')
          setTimeout(() => {
            this.router.navigate(['/gallery']);
          }, 2000);
        },
        error: (err) => {
          console.error('Errore di login', err);
          this.alertService.error('Email o password errati!');
        }
      });

    } else {
      // LOGICA REGISTRAZIONE
      if (!this.email || !this.password || !this.name || !this.surname) {
        this.alertService.error('Tutti i campi sono obbligatori!');
        return;
      }

      const userData = {
        name: this.name,
        surname: this.surname,
        email: this.email,
        password: this.password,
        role: this.role
      };

      this.authService.register(userData).subscribe({
        next: (res) => {
          console.log('Registrazione riuscita!', res);
          this.alertService.success('Registrazione completata con successo! Ora puoi accedere.');
          // RESET E CAMBIO SCHERMATA
          this.resetFields();
          this.isLoginMode = true; // Torna al login
        },
        error: (err) => {
          console.error('Errore di registrazione', err);
          this.alertService.error('Errore di registrazione')
          // Se l'errore è 400 (Bad Request), cerchiamo di estrarre il messaggio specifico
          if (err.error && err.error.error) {
              this.alertService.error(err.error.message);
          } else if (err.status === 400) {
              this.alertService.warning("Errore: questa email potrebbe essere già registrata.");
          } else {
              this.alertService.warning("Si è verificato un errore durante la registrazione.");
          }
        }
      });
    }
  }

  onGoogleLogin() {
    this.authService.loginWithGoogle();
  }
}
