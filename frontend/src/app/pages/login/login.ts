import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal, viewChild, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'; //per la disiscrizione dagli observable
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { VerifyCodeModal } from '../../components/verify-code-modal/verify-code-modal';
import { UserRequest } from '../../models/user.model';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';
import { UploadService } from '../../services/upload.service';
import { ImageUploader, AppUppyFile } from '../../components/image-uploader/image-uploader';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, VerifyCodeModal, ImageUploader],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private alertService = inject(AlertService);
  private uploadService = inject(UploadService);
  readonly authService = inject(AuthService);

  isLoginMode = signal<boolean>(true);
  showVerifyModal = signal<boolean>(false);
  pendingVerifyEmail = signal<string>('');

  isSubmitting = signal<boolean>(false);

  // Profile Picture Upload State
  readonly imageUploader = viewChild<ImageUploader>(ImageUploader);
  showUploadMode = signal<boolean>(false);
  isUploadingPropic = signal<boolean>(false);
  selectedFile = signal<File | null>(null);
  uploadError = signal<string | null>(null);

  authForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    surname: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    gender: ['other']
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['status'] === 'success') {
        // L'utente torna da Google: chiediamo i dati al backend inviando il cookie
        this.authService.refreshToken().subscribe({
          next: (res) => {
            console.log('Login con Google completato con successo!', res);
            if (res?.message) {
              this.alertService.show(res.message, res.type);
            }
            this.router.navigate(['/']);
          },
          error: (err) => {
            console.error('Errore durante il recupero dei dati di Google:', err);
            if (err.error?.message) {
              this.alertService.show(err.error.message, err.error.type || 'error');
            }
          }
        });
      } else if (params['status'] === 'verified') {
        this.alertService.success('Email verificata con successo! Ora puoi accedere al tuo account.');
      } else if (params['error']) {
        this.alertService.error('Errore durante la procedura di autenticazione con Google.');
      }
    });
  }

  formDataToUserModel(user: any): UserRequest {
    return {
      name: user.name,
      surname: user.surname,
      email: user.email,
      password: user.password,
      gender: user.gender || 'other'
    };
  }

  toggleMode(isLogin: boolean): void {
    this.isLoginMode.set(isLogin);
    this.authForm.reset({
      name: '',
      surname: '',
      email: '',
      password: '',
      gender: 'other'
    });
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
          next: (res) => {
            this.isSubmitting.set(false);
            const elapsed = Date.now() - requestStartTime;
            console.log(`[Frontend Debug] [${new Date().toISOString()}] Risposta POST /signup ricevuta in ${elapsed}ms:`, res);
            if (res?.message) {
              this.alertService.show(res.message, res.type);
            }
            this.pendingVerifyEmail.set(email);
            this.showVerifyModal.set(true);
          },
          error: (error) => {
            this.isSubmitting.set(false);
            const elapsed = Date.now() - requestStartTime;
            console.error(`[Frontend Debug] [${new Date().toISOString()}] Registrazione fallita dopo ${elapsed}ms:`, error);
            if (error.error?.message) {
              this.alertService.show(error.error.message, error.error.type || 'error');
            }
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
            if (response?.message) {
              this.alertService.show(response.message, response.type);
            }
          },
          error: (error) => {
            this.isSubmitting.set(false);
            console.error('Login failed:', error);
            if (error.error?.message) {
              this.alertService.show(error.error.message, error.error.type || 'error');
            }
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
      next: (res) => {
        console.log('Logout successful!', res);
        if (res?.message) {
          this.alertService.show(res.message, res.type);
        }
      },
      error: (error) => {
        console.error('Logout failed:', error);
        if (error.error?.message) {
          this.alertService.show(error.error.message, error.error.type || 'error');
        }
      }
    });
  }

  googleLogin(): void {
    this.authService.googleLogin();
  }

  onCodeVerified(res?: any): void {
    this.showVerifyModal.set(false);
    console.log('Utente verificato ed autenticato con successo:', res);
    if (res?.message) {
      this.alertService.show(res.message, res.type);
    }
    this.router.navigate(['/']);
  }

  onVerifyCancelled(): void {
    this.showVerifyModal.set(false);
  }

  getGenderLabel(gender?: string): string {
    let label: string = '';
    switch (gender) {
      case 'f':
        label = 'Femminile (F)';
        break;
      case 'm':
        label = 'Maschile (M)';
        break;
      case 'other':
      default:
        label = 'other';
        break;
    }
    return label;
  }

  // --- GESTIONE FOTO PROFILO ---

  getProfilePictureUrl(): string {
    const user = this.authService.currentUser();
    const url = user?.assets?.profilePicture?.url;
    const defaultPropic = '/assets/users/default/propic/default.jpeg';

    if (!url) {
      return defaultPropic;
    }

    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }

    return url;
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = '/assets/users/default/propic/default.jpeg';
    }
  }
  toggleUploadMode(): void {
    const current = this.showUploadMode();
    if (current) {
      this.cancelPropicUpload();
    } else {
      this.showUploadMode.set(true);
      this.uploadError.set(null);
    }
  }

  onUppyFilesChange(files: AppUppyFile[]): void {
    this.uploadError.set(null);
    if (files && files.length > 0) {
      const uppyFile = files[0];
      if (uppyFile.data instanceof File) {
        this.selectedFile.set(uppyFile.data);
      } else if (uppyFile.data instanceof Blob) {
        const file = new File([uppyFile.data], uppyFile.name, { type: uppyFile.type });
        this.selectedFile.set(file);
      }
    } else {
      this.selectedFile.set(null);
    }
  }

  onUppyRestrictionFailed(event: { file?: AppUppyFile; error: Error }): void {
    this.uploadError.set(event.error.message || 'Restrizione file non rispettata.');
  }

  cancelPropicUpload(): void {
    this.imageUploader()?.clearFiles();
    this.selectedFile.set(null);
    this.uploadError.set(null);
    this.showUploadMode.set(false);
  }

  savePropic(): void {
    const file = this.selectedFile();
    const currentUser = this.authService.currentUser();
    const userId = currentUser?.userId;

    if (!file || !userId) {
      this.uploadError.set('Nessun file selezionato o sessione non valida.');
      return;
    }

    this.isUploadingPropic.set(true);
    this.uploadError.set(null);

    this.uploadService.uploadUserPropic(userId, file).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.isUploadingPropic.set(false);
        this.authService.updateUserProfilePicture(res.url);
        this.alertService.success('Immagine del profilo aggiornata con successo!');
        this.cancelPropicUpload();
      },
      error: (err) => {
        this.isUploadingPropic.set(false);
        console.error('Errore caricamento foto profilo:', err);
        const errMsg = err.error?.message || err.message || 'Errore durante il caricamento dell\'immagine del profilo.';
        this.uploadError.set(errMsg);
        this.alertService.error(errMsg);
      }
    });
  }
}
