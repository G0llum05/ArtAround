import { Component, inject, signal, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserRequest } from '../../models/user.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'; //per la disiscrizione dagli observable
import { Router, ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { VerifyCodeModal } from '../../components/verify-code-modal/verify-code-modal';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, VerifyCodeModal],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  readonly authService = inject(AuthService);

  isLoginMode = signal<boolean>(true);
  showVerifyModal = signal<boolean>(false);
  pendingVerifyEmail = signal<string>('');
  verificationSuccessMessage = signal<string | null>(null);

  isSubmitting = signal<boolean>(false);

  authForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    surname: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['status'] === 'success') {
        // L'utente torna da Google: chiediamo i dati al backend inviando il cookie
        this.authService.refreshToken().subscribe({
          next: (res) => {
            console.log('Login con Google completato con successo!', res);
            // Reindirizziamo alla Home pulendo l'URL
            this.router.navigate(['/']);
          },
          error: (err) => {
            console.error('Errore durante il recupero dei dati di Google:', err);
          }
        });
      }
    });
  }

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
    this.verificationSuccessMessage.set(null);
    this.isSubmitting.set(false);

    const nameControl = this.authForm.get('name');
    const surnameControl = this.authForm.get('surname');

    if (isLogin) {
      nameControl?.clearValidators();
      surnameControl?.clearValidators();
    } else {
      nameControl?.setValidators(Validators.required);
      surnameControl?.setValidators(Validators.required);
    }
    nameControl?.updateValueAndValidity();
    surnameControl?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.isSubmitting()) {
      console.log('[Frontend Debug] Invio già in corso, click ignorato.');
      return;
    }

    console.log(this.isLoginMode() ? '[Frontend Debug] Intent login:' : '[Frontend Debug] Intent signup:', this.authForm.value);

    if (!this.isLoginMode()) { // REGISTRAZIONE
      if (this.authForm.invalid) {
        this.authForm.markAllAsTouched();
        console.warn('[Frontend Debug] Form di registrazione NON valido:', this.getInvalidControls());
        return;
      }

      const email = this.authForm.get('email')?.value;
      const requestStartTime = Date.now();
      this.isSubmitting.set(true);
      console.log(`[Frontend Debug] [${new Date().toISOString()}] Inizio chiamata HTTP POST /signup per email: ${email}`);

      this.authService.register(this.formDataToUserModel(this.authForm.value))
        .pipe(
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            const elapsed = Date.now() - requestStartTime;
            console.log(`[Frontend Debug] [${new Date().toISOString()}] Risposta POST /signup ricevuta dal backend in ${elapsed}ms. Apertura modale di verifica...`);
            this.pendingVerifyEmail.set(email);
            this.showVerifyModal.set(true);
          },
          error: (error) => {
            this.isSubmitting.set(false);
            const elapsed = Date.now() - requestStartTime;
            console.error(`[Frontend Debug] [${new Date().toISOString()}] Registrazione fallita dopo ${elapsed}ms:`, error);
          }
        });
    } else { // LOGIN
      const emailControl = this.authForm.get('email');
      const passwordControl = this.authForm.get('password');

      if (!emailControl?.valid || !passwordControl?.valid) {
        this.authForm.markAllAsTouched();
        console.warn('[Frontend Debug] Form di login NON valido (email o password non corrette).');
        return;
      }

      this.isSubmitting.set(true);
      this.authService.login({
        email: emailControl.value,
        password: passwordControl.value
      }).pipe(
        takeUntilDestroyed(this.destroyRef),
      )
        .subscribe({
          next: (response) => {
            this.isSubmitting.set(false);
            console.log('Login successful!', response);
          },
          error: (error) => {
            this.isSubmitting.set(false);
            console.error('Login failed:', error);
          }
        });
    }
  }

  private getInvalidControls(): string[] {
    const invalid: string[] = [];
    const controls = this.authForm.controls;
    for (const name in controls) {
      if (controls[name].invalid) {
        invalid.push(name);
      }
    }
    return invalid;
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

  googleLogin(): void {
    this.authService.googleLogin()
  }

  onCodeVerified(res?: any): void {
    this.showVerifyModal.set(false);
    console.log('Utente verificato ed autenticato con successo:', res);
    this.router.navigate(['/']);
  }


  onVerifyCancelled(): void {
    this.showVerifyModal.set(false);
  }

}

