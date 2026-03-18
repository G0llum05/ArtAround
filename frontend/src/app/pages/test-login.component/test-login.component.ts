import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-test-login',
  standalone: true,
  imports: [CommonModule, FormsModule], // Importa FormsModule per usare ngModel
  templateUrl: './test-login.component.html',
  styleUrls: ['./test-login.component.css']
})
export class TestLoginComponent {
  mail = '';
  password = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  // Quando l'utente clicca "Accedi" col form
  onSubmit() {
    this.authService.login(this.mail, this.password).subscribe({
      next: (res) => {
        console.log('Login riuscito!', res);
        this.router.navigate(['/gallery']); // Ti rimanda alla galleria se ok
      },
      error: (err) => {
        console.error('Errore di login', err);
        this.errorMessage = 'Credenziali non valide bro!';
      }
    });
  }

  // Quando l'utente clicca "Accedi con Google"
  onGoogleLogin() {
    this.authService.loginWithGoogle();
  }
}
