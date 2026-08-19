import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { Router } from '@angular/router'
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-marketplace',
  imports: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], //dice ad angular di accettare qualsiasi tag html anche sconosciuti in fase di build
  templateUrl: './marketplace.html',
  styleUrl: './marketplace.css',
})
export class Marketplace {
  router = inject(Router);
  authService = inject(AuthService);

  onAscoltaVanilla(event: Event) {
    const customEvent = event as CustomEvent;

    // Mostriamo un alert leggendo i dati inviati da Javascript puro!
    alert('ANGULAR DICE: Ho ricevuto questo -> ' + customEvent.detail.testo);
  }

  navigateTo(event: Event) {
    const navigation = event as CustomEvent;
    const dest = navigation.detail.destination as string;
    const id = navigation.detail.id as string;
    console.log(dest);
    if(dest) {
      if(id === dest) {
        this.router.navigate(['marketplace', id]);
      }
      else {
        this.router.navigate([dest]);
      }
    }

  }
}
