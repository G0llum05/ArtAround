import { Component, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserRequest } from '../../models/user.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'; //per la disiscrizione dagli observable
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  readonly authService = inject(AuthService);

  isLoginMode = signal<boolean>(true);

  authForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    surname: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  formDataToUserModel(user: any): UserRequest {
    return {
      name: user.name,
      surname: user.surname,
      email: user.email,
      password: user.password,
    }
  }

  toggleMode(isLogin: boolean): void {
    this.isLoginMode.set(isLogin);
    this.authForm.reset();

    const nameControl = this.authForm.get('name');
    if (isLogin) {
      nameControl?.clearValidators();
    } else {
      nameControl?.setValidators(Validators.required);
    }
    nameControl?.updateValueAndValidity();
  }

  onSubmit(): void {
    // submit signup
    console.log(this.isLoginMode() ? 'Login data:' : 'Signup data:', this.authForm.value);
    if (this.authForm.valid && !this.isLoginMode()) {
      this.authService.register(this.formDataToUserModel(this.authForm.value))
        .pipe(
          takeUntilDestroyed(this.destroyRef), //non necessario per le chiamate http ma per sicurezza aggiunto
        )
        .subscribe({
          // TODO CHECK parte grafica
          next: () => {
            this.authForm.markAllAsTouched()
            console.log('Registration successful!');
          },
          error: (error) => {
            console.error('Registration failed:', error);
          }
        });
    } else if (this.authForm.get('email')?.valid && this.authForm.get('password')?.valid && this.isLoginMode()) { // submit login
      this.authService.login({
        email: this.authForm.get('email')?.value,
        password: this.authForm.get('password')?.value
      }).pipe(
        takeUntilDestroyed(this.destroyRef), //non necessario per le chiamate http ma per sicurezza aggiunto
      )
        .subscribe({
          next: (response) => {
            console.log('Login successful!', response);
          },
          error: (error) => {
            console.error('Login failed:', error);
          }
        });
    }
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Logout successful!');
      },
      error: (error) => {
        console.error('Logout failed:', error);
      }
    });
  }
}
