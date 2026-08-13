import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-marketplace',
  imports: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], //dice ad angular di accettare qualsiasi tag html anche sconosciuti in fase di build
  templateUrl: './marketplace.html',
  styleUrl: './marketplace.css',
})
export class Marketplace {
  onAscoltaVanilla(event: Event) {
    const customEvent = event as CustomEvent;

    // Mostriamo un alert leggendo i dati inviati da Javascript puro!
    alert('ANGULAR DICE: Ho ricevuto questo -> ' + customEvent.detail.testo);
  }
}
