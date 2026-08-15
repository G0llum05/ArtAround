import { Component, Input, Output, EventEmitter, inject, signal, ElementRef, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AuthResponse } from '../../models/user.model';

@Component({
  selector: 'app-verify-code-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-code-modal.html',
  styleUrl: './verify-code-modal.css'
})
export class VerifyCodeModal implements AfterViewInit {
  private readonly authService = inject(AuthService);

  @Input({ required: true }) email: string = '';
  @Output() verified = new EventEmitter<AuthResponse>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

  digits = signal<string[]>(['', '', '', '', '', '']);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  private modalInitTime = Date.now();

  constructor() {
    console.log(`[Frontend Modal Debug] [${new Date().toISOString()}] Instanziato componente VerifyCodeModal`);
  }

  ngAfterViewInit(): void {
    const renderTime = Date.now() - this.modalInitTime;
    console.log(`[Frontend Modal Debug] [${new Date().toISOString()}] ngAfterViewInit completato in ${renderTime}ms. Impostazione focus sul primo input...`);
    // Focus automatico sul primo campo all'apertura del modal
    setTimeout(() => {
      const inputs = this.digitInputs.toArray();
      if (inputs.length > 0) {
        inputs[0].nativeElement.focus();
        console.log(`[Frontend Modal Debug] [${new Date().toISOString()}] Focus applicato sul primo input OTP`);
      }
    }, 50);
  }


  isCodeComplete(): boolean {
    return this.digits().every(d => d.trim().length === 1);
  }

  getCode(): string {
    return this.digits().join('');
  }

  onInput(event: Event, index: number): void {
    const inputEl = event.target as HTMLInputElement;
    const value = inputEl.value;

    // Prendi solo l'ultimo carattere inserito se per sbaglio ce n'è più di uno
    const char = value.length > 0 ? value[value.length - 1] : '';

    if (!/^\d*$/.test(char)) {
      inputEl.value = '';
      return;
    }

    const currentDigits = [...this.digits()];
    currentDigits[index] = char;
    this.digits.set(currentDigits);
    this.errorMessage.set(null);

    // Sposta il focus al campo successivo se abbiamo inserito una cifra
    if (char && index < 5) {
      const inputs = this.digitInputs.toArray();
      if (inputs[index + 1]) {
        inputs[index + 1].nativeElement.focus();
      }
    }

    // Se tutte le 6 cifre sono inserite, tenta la verifica automatica
    if (this.isCodeComplete()) {
      this.verify();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    const inputs = this.digitInputs.toArray();

    if (event.key === 'Backspace') {
      if (!this.digits()[index] && index > 0) {
        // Se il campo attuale è vuoto e viene premuto Backspace, sposta il focus al precedente
        event.preventDefault();
        inputs[index - 1].nativeElement.focus();
        const currentDigits = [...this.digits()];
        currentDigits[index - 1] = '';
        this.digits.set(currentDigits);
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      inputs[index - 1].nativeElement.focus();
    } else if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      inputs[index + 1].nativeElement.focus();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const pastedText = clipboardData.getData('text').trim();
    // Filtra solo le cifre
    const digitsOnly = pastedText.replace(/\D/g, '').slice(0, 6);

    if (digitsOnly.length > 0) {
      const newDigits = ['', '', '', '', '', ''];
      for (let i = 0; i < digitsOnly.length; i++) {
        newDigits[i] = digitsOnly[i];
      }
      this.digits.set(newDigits);
      this.errorMessage.set(null);

      const inputs = this.digitInputs.toArray();
      const focusIndex = Math.min(digitsOnly.length, 5);
      if (inputs[focusIndex]) {
        inputs[focusIndex].nativeElement.focus();
      }

      if (this.isCodeComplete()) {
        this.verify();
      }
    }
  }

  verify(): void {
    if (!this.isCodeComplete() || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const code = this.getCode();

    this.authService.verifyCode(this.email, code).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set('Email verificata! Autenticazione in corso...');
        setTimeout(() => {
          this.verified.emit(res);
        }, 1000);
      },

      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || 'Codice non valido o scaduto. Riprova.';
        this.errorMessage.set(msg);
        
        // Reset dei campi per un nuovo inserimento se errato
        this.digits.set(['', '', '', '', '', '']);
        const inputs = this.digitInputs.toArray();
        if (inputs.length > 0) {
          inputs[0].nativeElement.focus();
        }
      }
    });
  }

  onClose(): void {
    this.cancelled.emit();
  }
}
