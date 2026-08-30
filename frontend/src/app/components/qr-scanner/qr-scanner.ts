import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { QrService } from '../../services/qr.service';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule, ZXingScannerModule],
  template: `
    <div class="scanner-container">
      <button class="close-btn" (click)="closeScanner.emit()" aria-label="Chiudi scanner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>

      <div class="scanner-target-box">
        <div class="corner top-left"></div>
        <div class="corner top-right"></div>
        <div class="corner bottom-left"></div>
        <div class="corner bottom-right"></div>
        <div class="scan-laser-line"></div>
      </div>

      <zxing-scanner
        (scanSuccess)="onCodeResult($any($event))"
        [formats]="allowedFormats">
      </zxing-scanner>

      <div class="scanner-manual-fallback">
        <input
          type="text"
          class="manual-code-input"
          placeholder="Inserisci codice QR o ID..."
          [(ngModel)]="manualCode"
          (keyup.enter)="onManualSubmit()"
        />
        <button type="button" class="btn-manual-submit" (click)="onManualSubmit()">
          Invia
        </button>
      </div>
    </div>
  `,
  styleUrl: './qr-scanner.css',
})
export class QrScanner {
  closeScanner = output<void>();

  private qrService = inject(QrService);

  allowedFormats = [BarcodeFormat.QR_CODE];
  manualCode = signal<string>('');

  async onCodeResult(resultString: string): Promise<void> {
    if (!resultString) return;
    this.closeScanner.emit();
    await this.qrService.handleScannedCode(resultString);
  }

  async onManualSubmit(): Promise<void> {
    const code = this.manualCode().trim();
    if (!code) return;
    this.closeScanner.emit();
    await this.qrService.handleScannedCode(code);
  }
}
