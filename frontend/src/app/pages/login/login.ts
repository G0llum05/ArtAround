import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal, viewChild, computed, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'; //per la disiscrizione dagli observable
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { VerifyCodeModal } from '../../components/verify-code-modal/verify-code-modal';
import { UserRequest } from '../../models/user.model';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';
import { UploadService } from '../../services/upload.service';
import { VisitService } from '../../services/visit.service';
import { VisitHomePresentationResponse } from '../../models/visit.model';
import { ImageUploader, AppUppyFile } from '../../components/image-uploader/image-uploader';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, VerifyCodeModal, ImageUploader, RouterLink],
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
  private visitService = inject(VisitService);
  readonly authService = inject(AuthService);

  isLoginMode = signal<boolean>(true);
  showVerifyModal = signal<boolean>(false);
  pendingVerifyEmail = signal<string>('');

  isSubmitting = signal<boolean>(false);
  returnUrl = signal<string>('/');

  // Profile Visits & Tabs
  activeProfileTab = signal<'created' | 'purchased' | 'info'>('created');
  createdVisits = signal<VisitHomePresentationResponse[]>([]);
  purchasedVisits = signal<VisitHomePresentationResponse[]>([]);
  isLoadingVisits = signal<boolean>(false);

  // Profile Picture Upload State
  readonly imageUploader = viewChild<ImageUploader>(ImageUploader);
  showUploadMode = signal<boolean>(false);
  isUploadingPropic = signal<boolean>(false);
  selectedFile = signal<File | null>(null);
  uploadError = signal<string | null>(null);

  // Profile Settings Edit State
  isEditingProfile = signal<boolean>(false);
  isUpdatingProfile = signal<boolean>(false);
  editProfileForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    surname: ['', Validators.required],
    gender: ['other', Validators.required]
  });

  authForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    surname: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    gender: ['other']
  });

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user?.userId) {
        this.loadUserVisits();
      } else {
        this.createdVisits.set([]);
        this.purchasedVisits.set([]);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['returnUrl']) {
        this.returnUrl.set(params['returnUrl']);
        try {
          localStorage.setItem('artaround_returnUrl', params['returnUrl']);
        } catch (e) {}
      } else {
        const saved = localStorage.getItem('artaround_returnUrl');
        if (saved && !saved.startsWith('/login')) {
          this.returnUrl.set(saved);
        }
      }

      if (params['status'] === 'success') {
        // L'utente torna da Google: chiediamo i dati al backend inviando il cookie
        this.authService.refreshToken().subscribe({
          next: (res) => {
            console.log('Login con Google completato con successo!', res);
            if (res?.message) {
              this.alertService.show(res.message, res.type);
            }
            this.navigateAfterAuth();
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

  private navigateAfterAuth(): void {
    let target = this.returnUrl() || localStorage.getItem('artaround_returnUrl') || '/';
    try {
      localStorage.removeItem('artaround_returnUrl');
    } catch (e) {}

    if (!target || target === '/login' || target.startsWith('/login?')) {
      target = '/';
    }
    this.router.navigateByUrl(target);
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
            this.navigateAfterAuth();
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
    const returnTarget = this.returnUrl();
    if (returnTarget && !returnTarget.startsWith('/login')) {
      try {
        localStorage.setItem('artaround_returnUrl', returnTarget);
      } catch (e) {}
    }
    this.authService.googleLogin();
  }

  onCodeVerified(res?: any): void {
    this.showVerifyModal.set(false);
    console.log('Utente verificato ed autenticato con successo:', res);
    if (res?.message) {
      this.alertService.show(res.message, res.type);
    }
    this.navigateAfterAuth();
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
        label = 'Preferisco non precisarlo';
        break;
    }
    return label;
  }

  // --- GESTIONE MODIFICA DATI UTENTE ---
  startEditProfile(): void {
    const user = this.authService.currentUser();
    if (!user) return;
    this.editProfileForm.reset({
      name: user.name || '',
      surname: user.surname || '',
      gender: user.gender || 'other'
    });
    this.isEditingProfile.set(true);
  }

  cancelEditProfile(): void {
    this.isEditingProfile.set(false);
  }

  saveEditProfile(): void {
    if (this.editProfileForm.invalid) {
      this.editProfileForm.markAllAsTouched();
      return;
    }
    const user = this.authService.currentUser();
    const userId = user?.userId || (user as any)?.id || (user as any)?._id;
    if (!userId) {
      this.alertService.error('Sessione utente non valida.');
      return;
    }

    const { name, surname, gender } = this.editProfileForm.value;
    const cleanName = name?.trim() || '';
    const cleanSurname = surname?.trim() || '';
    this.isUpdatingProfile.set(true);

    this.authService.updateUserProfile(userId, {
      name: cleanName,
      surname: cleanSurname,
      gender
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.isUpdatingProfile.set(false);
        this.isEditingProfile.set(false);
        this.authService.updateCurrentUser({
          name: cleanName,
          surname: cleanSurname,
          gender: gender
        });
        this.editProfileForm.reset({
          name: cleanName,
          surname: cleanSurname,
          gender
        });
        this.alertService.success('Dati personali aggiornati con successo!');
      },
      error: (err) => {
        this.isUpdatingProfile.set(false);
        console.error('Errore aggiornamento profilo:', err);
        const msg = err.error?.message || 'Errore durante l\'aggiornamento del profilo.';
        this.alertService.error(msg);
      }
    });
  }

  // --- GESTIONE FOTO PROFILO ---
  hasImageError = signal<boolean>(false);

  profilePictureUrl = computed(() => {
    if (this.hasImageError()) {
      return null;
    }
    const user = this.authService.currentUser();
    const url = user?.assets?.profilePicture?.url;
    if (!url || url.includes('default.jpeg')) {
      return null;
    }
    return url;
  });

  onImageError(): void {
    this.hasImageError.set(true);
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
        this.hasImageError.set(false);
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

  loadUserVisits(): void {
    const user = this.authService.currentUser();
    const userId = user?.userId;
    if (!userId) return;

    this.isLoadingVisits.set(true);
    let pending = 2;
    const checkDone = () => {
      pending--;
      if (pending <= 0) {
        this.isLoadingVisits.set(false);
      }
    };

    this.visitService.getCreatedVisits(userId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (visits) => {
        this.createdVisits.set(visits || []);
        checkDone();
      },
      error: (err) => {
        console.warn('Errore recupero visite create:', err);
        checkDone();
      }
    });

    this.visitService.getPurchasedVisits(userId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (visits) => {
        this.purchasedVisits.set(visits || []);
        checkDone();
      },
      error: (err) => {
        console.warn('Errore recupero visite acquistate:', err);
        checkDone();
      }
    });
  }

  setProfileTab(tab: 'created' | 'purchased' | 'info'): void {
    this.activeProfileTab.set(tab);
    if ((tab === 'created' || tab === 'purchased') && this.authService.isLoggedIn()) {
      this.loadUserVisits();
    }
  }

  onDeleteVisit(visit: VisitHomePresentationResponse): void {
    if (!visit?.id) return;
    const confirmed = window.confirm(`Sei sicuro di voler eliminare la visita "${visit.title}"? L'azione è irreversibile.`);
    if (!confirmed) return;

    this.visitService.delete(visit.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.createdVisits.update(list => list.filter(v => v.id !== visit.id));
        this.alertService.success(`Visita "${visit.title}" eliminata con successo.`);
      },
      error: (err) => {
        console.error('Errore durante l\'eliminazione della visita:', err);
        const msg = err.error?.message || 'Errore durante l\'eliminazione della visita.';
        this.alertService.error(msg);
      }
    });
  }

  onEditVisit(visit: VisitHomePresentationResponse): void {
    this.alertService.show(`La funzionalità di modifica per "${visit.title}" sarà disponibile a breve.`, 'warning');
  }

  onViewVisit(visitId: string): void {
    this.router.navigate(['/marketplace/visit/search', visitId]);
  }

  onStartVisit(visitId: string): void {
    this.router.navigate(['/navigator'], { queryParams: { visitId } });
  }

  formatDuration(duration?: number): string {
    if (!duration) return 'Durata libera';
    if (duration >= 60) {
      const h = Math.floor(duration / 60);
      const m = duration % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${duration}m`;
  }

  getVisitImageUrl(visit: VisitHomePresentationResponse): string {
    if (visit?.assets?.images && visit.assets.images.length > 0) {
      const img = visit.assets.images[0];
      if (typeof img === 'string') return img;
      if (typeof img === 'object' && img?.url) return img.url;
    }
    return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600';
  }
}
