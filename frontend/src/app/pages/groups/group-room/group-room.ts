import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { GroupService } from '../../../services/group.service';
import { GroupSocketService } from '../../../services/group-socket.service';
import { QuizService } from '../../../services/quiz.service';

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
  private quizService = inject(QuizService);

  session = signal<any | null>(null);
  sessionCode = signal<string>('');
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  copied = signal<boolean>(false);
  includeQuiz = signal<boolean>(true);
  activeQuizId = signal<string | null>(null);

  isTeacher = computed(() => {
    const role = this.authService.userRole();
    const currentUserId = this.authService.currentUser()?.userId;
    const teacherId = this.session()?.teacher?.id || this.session()?.teacher?._id;
    return role === 'admin' || role === 'teacher' || role === 'museumstaff' || (currentUserId && currentUserId === teacherId);
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

  isStarting = signal<boolean>(false);
  private unregisterSessionStarted: (() => void) | null = null;
  private pollInterval: any = null;

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    // Ascolta l'evento WebSocket quando il docente avvia la visita
    this.unregisterSessionStarted = this.socketService.onSessionStarted((data: any) => {
      console.log('[GroupRoom] La visita è stata avviata dal docente:', data);
      const visitId = data?.visitId || this.session()?.visit?.id || this.session()?.visit?._id || this.session()?.visit;
      const code = data?.sessionCode || this.sessionCode() || this.session()?.sessionCode;
      this.navigateToNavigator(code, visitId);
    });

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
    if (this.unregisterSessionStarted) {
      this.unregisterSessionStarted();
      this.unregisterSessionStarted = null;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private navigateToNavigator(code: string, visitId: string): void {
    if (!code || !visitId) return;
    this.router.navigate(['/navigator'], {
      queryParams: {
        visitId: visitId,
        sessionCode: code.toUpperCase().trim(),
        isGroup: 'true',
        isTeacher: this.isTeacher() ? 'true' : 'false'
      }
    });
  }

  private startBackgroundPolling(code: string): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    this.pollInterval = setInterval(() => {
      this.groupService.getSessionByCode(code).subscribe({
        next: (res) => {
          const sessionData = res.data || res;
          if (sessionData?.status === 'in_progress') {
            const visitId = sessionData.visit?.id || sessionData.visit?._id || sessionData.visit;
            this.navigateToNavigator(code, visitId);
            return;
          }
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

        // Se la sessione è già stata avviata, reindirizza direttamente al navigatore
        if (sessionData.status === 'in_progress') {
          const visitId = sessionData.visit?.id || sessionData.visit?._id || sessionData.visit;
          this.navigateToNavigator(code, visitId);
          return;
        }

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

  async startGroupVisit(): Promise<void> {
    const code = this.sessionCode() || this.session()?.sessionCode;
    const sessionId = this.session()?.id || this.session()?._id;
    const visitId = this.session()?.visit?.id || this.session()?.visit?._id || this.session()?.visit;
    if (!code) return;

    this.isStarting.set(true);
    this.errorMessage.set(null);

    if (this.includeQuiz() && visitId) {
      try {
        await firstValueFrom(this.quizService.generateQuiz({
          visitId: String(visitId),
          numberOfQuestions: 5,
          difficulty: 'medium',
          targetAge: 'studente',
          language: 'it'
        }));
      } catch (quizErr) {
        console.warn('[GroupRoom] Generazione quiz in background non bloccante:', quizErr);
      }
    }

    this.socketService.startSession(code, sessionId)
      .then((res: any) => {
        const vId = res?.visitId || visitId;
        this.navigateToNavigator(code, vId);
      })
      .catch((err: any) => {
        this.isStarting.set(false);
        this.errorMessage.set(err?.message || 'Errore durante l\'avvio della visita guidata.');
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
