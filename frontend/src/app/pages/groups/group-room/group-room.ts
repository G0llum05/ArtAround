import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { GroupService } from '../../../services/group.service';
import { GroupSocketService } from '../../../services/group-socket.service';

@Component({
  selector: 'app-group-room',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './group-room.html',
  styleUrl: './group-room.css'
})
export class GroupRoom implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected authService = inject(AuthService);
  private groupService = inject(GroupService);
  protected socketService = inject(GroupSocketService);

  session = signal<any | null>(null);
  sessionCode = signal<string>('');
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  copied = signal<boolean>(false);

  isTeacher = computed(() => {
    const role = this.authService.userRole();
    const currentUserId = this.authService.currentUser()?.userId;
    const teacherId = this.session()?.teacher?.id || this.session()?.teacher?._id;
    return role === 'admin' || role === 'teacher' || (currentUserId && currentUserId === teacherId);
  });

  studentParticipants = computed(() => {
    const teacherEmail = this.session()?.teacher?.email?.toLowerCase()?.trim();
    const teacherId = (this.session()?.teacher?.id || this.session()?.teacher?._id)?.toString();
    return this.socketService.participants().filter(p => {
      const pEmail = p.email?.toLowerCase()?.trim();
      const pId = (p.userId || p.id || p.user)?.toString();
      if (teacherEmail && pEmail === teacherEmail) return false;
      if (teacherId && pId === teacherId) return false;
      return true;
    });
  });

  onlineCount = computed(() => {
    return this.studentParticipants().filter(p => p.isOnline === true).length;
  });

  private pollInterval: any = null;

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    this.route.paramMap.subscribe(params => {
      const code = params.get('code');
      if (code && code !== 'new') {
        this.loadSessionByCode(code);
      } else {
        // Se si arriva da visit-preview con queryParams visitId per creare la stanza
        this.route.queryParamMap.subscribe(queryParams => {
          const visitId = queryParams.get('visitId');
          const title = queryParams.get('visitTitle');
          if (visitId) {
            this.createNewSession(visitId, title || undefined);
          } else {
            this.errorMessage.set('Nessun codice stanza o visita specificato.');
            this.isLoading.set(false);
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    const code = this.sessionCode() || this.session()?.sessionCode;
    if (code && !this.isTeacher()) {
      this.groupService.leaveSession(code).subscribe({
        next: () => {},
        error: () => {}
      });
    }
    this.socketService.leaveRoom(code);
  }

  private startBackgroundPolling(code: string): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    this.pollInterval = setInterval(() => {
      this.groupService.getSessionByCode(code).subscribe({
        next: (res) => {
          const sessionData = res.data || res;
          if (sessionData?.participants) {
            this.socketService.participants.set(sessionData.participants);
          }
        },
        error: () => {}
      });
    }, 4000);
  }

  loadSessionByCode(code: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.sessionCode.set(code.toUpperCase());

    this.groupService.getSessionByCode(code).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const sessionData = res.data || res;
        this.session.set(sessionData);
        if (sessionData.participants) {
          this.socketService.participants.set(sessionData.participants);
        }
        // Connetti WebSocket in tempo reale
        this.socketService.connect(code.toUpperCase());
        // Avvia polling di sincronizzazione in background come garanzia
        this.startBackgroundPolling(code.toUpperCase());
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || `Impossibile trovare la stanza "${code}".`);
      }
    });
  }

  createNewSession(visitId: string, title?: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.groupService.createSession({ visitId, title }).subscribe({
      next: (res) => {
        const sessionData = res.data;
        if (sessionData?.sessionCode) {
          // Reindirizza alla rotta col PIN effettivo
          this.router.navigate(['/groups/room', sessionData.sessionCode], { replaceUrl: true });
        } else {
          this.session.set(sessionData);
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Errore durante la creazione della stanza di gruppo.');
      }
    });
  }

  copyPin(): void {
    const code = this.sessionCode() || this.session()?.sessionCode;
    if (code) {
      navigator.clipboard.writeText(code);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }

  leaveRoom(): void {
    const code = this.sessionCode() || this.session()?.sessionCode;
    if (code && !this.isTeacher()) {
      this.groupService.leaveSession(code).subscribe({
        next: () => {},
        error: () => {}
      });
    }
    this.socketService.leaveRoom(code);
    this.router.navigate(['/groups']);
  }
}
