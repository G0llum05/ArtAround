import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterOutlet, RouterLink, RouterLinkActive, ActivatedRoute, Router } from '@angular/router';
import { ToolbarComponent } from './components/toolbar/toolbar';
import { ToastNotification } from './components/toast-notification/toast-notification';
import { AuthService } from './services/auth.service';

export interface Art {
  title: string;
  description: string;
}
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ToolbarComponent,
    ToastNotification
  ],  // Importiamo RouterOutlet che serve a mostrare i componenti in base alla rotta, e RouterLink per i link di navigazione
  templateUrl: './app.html',
  styleUrl: './app.css',
})

export class App implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    // Esponi il router alla shell
    (window as any).__angularRouter = this.router;
  }
}
// export class App implements OnInit {
//   // Invece del costruttore, usiamo la funzione inject() che avevi già importato!
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private authService = inject(AuthService);
//
//   ngOnInit() {
//     // Angular "ascolta" i parametri nell'URL.
//     // Se vede un ?token=... significa che stiamo tornando dal backend dopo il login con Google!
//     this.route.queryParams.subscribe(params => {
//       const token = params['token'];
//       if (token) {
//         // Salviamo il token nel localStorage tramite il nostro servizio
//         this.authService.saveToken(token);
//         console.log('Token catturato dall\'URL e salvato con successo!');
//
//         // Puliamo l'URL rimuovendo il parametro "?token=..."
//         // così non rimane visibile nella barra degli indirizzi dell'utente
//         this.router.navigate([], {
//           relativeTo: this.route,
//           queryParams: { token: null },
//           queryParamsHandling: 'merge', // Mantiene eventuali altri parametri intatti
//           replaceUrl: true // Sostituisce la cronologia del browser per non far tornare indietro l'utente al token
//         });
//       }
//     });
//   }
// }


// import { Component, OnInit, inject } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import {RouterOutlet, RouterLink, RouterLinkActive} from '@angular/router';
// import {ToolbarComponent} from './components/toolbar/toolbar';
//
// export interface Art {
//   title: string;
//   description: string;
// }
//
// @Component({
//   selector: 'app-root',
//   standalone: true,
//   imports: [
//     RouterOutlet,
//     RouterLink,
//     RouterLinkActive,
//     ToolbarComponent
//   ],  // Importiamo RouterOutlet che serve a mostrare i componenti in base alla rotta, e RouterLink per i link di navigazione
//   templateUrl: './app.html',
//   styleUrl: './app.css',
// })
//
// export class App {
//
// }
