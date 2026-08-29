import { Component, inject, output } from '@angular/core';
import { Router } from '@angular/router';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [ZXingScannerModule],
  template: `
    <div class="scanner-container">
      <!-- Pulsante di chiusura -->
      <button class="close-btn" (click)="closeScanner.emit()" aria-label="Chiudi scanner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>

      <!-- Fotocamera -->
      <zxing-scanner
        (scanSuccess)="onCodeResult($any($event))"
        [formats]="allowedFormats">
      </zxing-scanner>
    </div>
  `,
  styleUrl: './qr-scanner.css',
})
export class QrScanner {
  closeScanner = output<void>();

  private router = inject(Router);

  allowedFormats = [BarcodeFormat.QR_CODE];

  onCodeResult(resultString: string) {
    try {
      // Estrae l'ID dall'URL letto dal QR Code
      const url = new URL(resultString);
      const pathParts = url.pathname.split('/').filter(Boolean);

      // immaginando che l'ipotetico url sia /artworks/:id
      if (pathParts.length === 2 && pathParts[0] === 'artworks') {
        const id = pathParts[1];
        this.closeScanner.emit();
        this.router.navigate(['/artworks', id]);
      } else {
        alert("Attenzione: questo QR code non appartiene a un'opera del museo.");
      }
    } catch (e) {
      console.error('QR Code non valido o non associato a un URL:', resultString);
      alert('Il QR Code inquadrato non è valido.');
    }
  }
}
