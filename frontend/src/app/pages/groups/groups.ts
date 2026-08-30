import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GroupService } from '../../services/group.service';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './groups.html',
  styleUrl: './groups.css'
})
export class Groups {
  protected authService = inject(AuthService);
  private groupService = inject(GroupService);
  private router = inject(Router);

  pinCode = signal<string>('');
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Verifica se l'utente ha i permessi per creare un gruppo
  canCreateGroup = computed(() => {
    const role = this.authService.userRole();
    return role === 'teacher' || role === 'museumstaff' || role === 'admin';
  });

  onJoinGroup(): void {
    const code = this.pinCode().trim().toUpperCase();
    this.errorMessage.set(null);
    this.successMessage.set(null);

    // Se l'utente non è autenticato, reindirizza direttamente alla pagina di login
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/groups' }
      });
      return;
    }

    if (!code) {
      this.errorMessage.set('Inserisci il codice PIN della stanza.');
      return;
    }

    if (code.length < 3) {
      this.errorMessage.set('Il codice PIN inserito è troppo corto.');
      return;
    }

    this.isLoading.set(true);

    this.groupService.joinSession(code).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set('Connessione alla visita riuscita!');
        console.log('Accesso al gruppo riuscito:', res);
        this.router.navigate(['/groups/room', code]);
      },
      error: (err) => {
        this.isLoading.set(false);
        const serverMessage = err.error?.message;
        if (serverMessage) {
          this.errorMessage.set(serverMessage);
        } else if (err.status === 404 || err.status === 400) {
          this.errorMessage.set(`Nessuna stanza trovata con il codice "${code}". Controlla il PIN e riprova.`);
        } else if (err.status === 401) {
          this.errorMessage.set('Sessione scaduta o non valida. Effettua nuovamente il login.');
        } else {
          this.errorMessage.set('Impossibile contattare il server. Verifica la tua connessione e riprova.');
        }
      }
    });
  }

  onCreateGroup(): void {
    console.log('Reindirizzamento alla sezione visite per selezionare la visita di gruppo');
    this.router.navigate(['/marketplace/visit/search']);
  }

  clearError(): void {
    this.errorMessage.set(null);
  }
}
