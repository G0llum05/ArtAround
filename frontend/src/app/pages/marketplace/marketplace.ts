import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-marketplace',
  imports: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // angular accetta cosi anche dei tag non standard
  templateUrl: './marketplace.html',
  styleUrl: './marketplace.css',
})
export class Marketplace {
  router = inject(Router);
  authService = inject(AuthService);

  currentRoute = toSignal(
    this.router.events.pipe(
      filter((evnt): evnt is NavigationEnd => evnt instanceof NavigationEnd ),
      map((evnt) => evnt.urlAfterRedirects || evnt.url )
    ),
    { initialValue: this.router.url }
  );

  // onAscoltaVanilla(event: Event) {
  //   const customEvent = event as CustomEvent;

  //   // Mostriamo un alert leggendo i dati inviati da Javascript puro!
  //   alert('ANGULAR DICE: Ho ricevuto questo -> ' + customEvent.detail.testo);
  // }

  navigateTo(event: Event) {
    const navigation = event as CustomEvent;
    const dest = navigation.detail?.destination as string;
    const id = navigation.detail?.id as string;
    const queryParams = navigation.detail?.queryParams;

    if (dest) {
      const url = dest.startsWith('/') ? dest : '/' + dest;
      if (id && id === dest) {
        this.router.navigate(['marketplace', id]);
      } else if (queryParams) {
        this.router.navigate([url], { queryParams });
      } else {
        this.router.navigateByUrl(url);
      }
    }
  }
}
