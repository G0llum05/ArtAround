import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);

  isLoginMode = signal<boolean>(true);

  authForm: FormGroup = this.fb.group({
    name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

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
    if (this.authForm.valid) {
      console.log(this.isLoginMode() ? 'Login data:' : 'Signup data:', this.authForm.value);
    } else {
      this.authForm.markAllAsTouched();
    }
  }
}
