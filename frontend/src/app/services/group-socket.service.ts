import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    io?: any;
  }
}

export interface StudentAudioProgress {
  userId: string;
  name: string;
  status: 'listening' | 'completed' | 'paused' | 'not_started';
  stepIndex?: number;
  updatedAt?: string;
}

export interface StudentsAudioSummary {
  stepIndex: number;
  totalStudents: number;
  completedCount: number;
  listeningCount: number;
  pausedCount: number;
  notStartedCount: number;
  students: StudentAudioProgress[];
}

@Injectable({
  providedIn: 'root'
})
export class GroupSocketService {
  private authService = inject(AuthService);
  private socket: any = null;

  // Reattivi
  isConnected = signal<boolean>(false);
  participants = signal<any[]>([]);
  currentStepIndex = signal<number>(0);
  isLocked = signal<boolean>(true);
  studentsAudioSummary = signal<StudentsAudioSummary | null>(null);
  activeQuiz = signal<any | null>(null);
  quizState = signal<'not_started' | 'in_progress' | 'completed'>('not_started');
  groupMessages = signal<any[]>([]);

  // Callbacks per eventi
  private sessionStartedCallbacks: Array<(data: any) => void> = [];
  private stepChangedCallbacks: Array<(data: { stepIndex: number; activeItem?: any }) => void> = [];
  private lockToggledCallbacks: Array<(data: { isLocked: boolean }) => void> = [];
  private sessionEndedCallbacks: Array<(data: { message?: string }) => void> = [];
  private studentsAudioStatusCallbacks: Array<(summary: StudentsAudioSummary) => void> = [];
  private quizStartedCallbacks: Array<(data: any) => void> = [];
  private quizStudentSubmittedCallbacks: Array<(data: any) => void> = [];
  private quizEndedCallbacks: Array<(data: any) => void> = [];
  private newMessageCallbacks: Array<(data: any) => void> = [];

  private getBackendUrl(): string {
    if (typeof window !== 'undefined') {
      if (window.location.port === '4200') {
        return `${window.location.protocol}//${window.location.hostname}:8000`;
      }
      if (environment.apiUrl.startsWith('http')) {
        return new URL(environment.apiUrl).origin;
      }
      return window.location.origin;
    }
    return 'http://localhost:8000';
  }

  private loadSocketScript(): Promise<any> {
    if (typeof window !== 'undefined' && window.io) {
      return Promise.resolve(window.io);
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.socket.io/4.8.1/socket.io.min.js';
      script.async = true;
      script.onload = () => {
        console.log('[GroupSocket] Libreria Socket.IO caricata con successo da CDN.');
        resolve(window.io);
      };
      script.onerror = () => {
        const backendUrl = this.getBackendUrl();
        const fallbackScript = document.createElement('script');
        fallbackScript.src = `${backendUrl}/socket.io/socket.io.js`;
        fallbackScript.async = true;
        fallbackScript.onload = () => resolve(window.io);
        fallbackScript.onerror = (err) => reject(err);
        document.head.appendChild(fallbackScript);
      };
      document.head.appendChild(script);
    });
  }

  private handleJoinResponse(res: any, sessionCode: string): void {
    if (res?.success && res.session) {
      console.log('[GroupSocket] Entrato nella stanza con successo:', res.session);
      if (res.session.participants) {
        this.participants.set(res.session.participants);
      }
      if (typeof res.session.currentStepIndex === 'number') {
        this.currentStepIndex.set(res.session.currentStepIndex);
      }
      if (res.session.activeQuiz && res.session.quizState && res.session.quizState !== 'not_started') {
        this.activeQuiz.set(res.session.activeQuiz);
        this.quizState.set(res.session.quizState);
        if (res.session.quizState === 'in_progress') {
          this.quizStartedCallbacks.forEach(cb => {
            try {
              cb({
                sessionCode,
                quizState: 'in_progress',
                quiz: res.session.activeQuiz,
                mySubmission: res.session.mySubmission,
                submissions: res.session.quizSubmissions || []
              });
            } catch (e) { console.error(e); }
          });
        } else if (res.session.quizState === 'completed') {
          this.quizEndedCallbacks.forEach(cb => {
            try {
              cb({
                sessionCode,
                quizState: 'completed',
                quiz: res.session.activeQuiz,
                leaderboard: res.session.quizSubmissions || [],
                myResult: res.session.mySubmission
              });
            } catch (e) { console.error(e); }
          });
        }
      }
      if (res.session.questions && Array.isArray(res.session.questions)) {
        const mapped = res.session.questions.map((q: any) => ({
          id: q.id || q._id,
          senderId: q.studentId || (q.student?._id ? q.student._id : q.student),
          senderName: q.studentName,
          senderRole: q.studentRole || 'student',
          text: q.text,
          stepIndex: q.stepIndex,
          createdAt: q.createdAt
        }));
        this.groupMessages.set(mapped);
        mapped.forEach((msgObj: any) => {
          this.newMessageCallbacks.forEach(cb => {
            try { cb(msgObj); } catch (e) { console.error(e); }
          });
        });
      }
    }
  }

  async connect(sessionCode: string): Promise<void> {
    const code = sessionCode.toUpperCase().trim();
    if (this.socket && this.isConnected()) {
      this.socket.emit('session:join', { sessionCode: code }, (res: any) => {
        this.handleJoinResponse(res, code);
      });
      return;
    }

    if (this.socket) {
      this.disconnect();
    }

    try {
      const ioFactory = await this.loadSocketScript();
      const token = this.authService.getAccessToken() || localStorage.getItem('artaround_accessToken');
      const backendUrl = this.getBackendUrl();

      console.log(`[GroupSocket] Connessione a ${backendUrl} per la stanza ${code}...`);

      this.socket = ioFactory(backendUrl, {
        path: '/socket.io',
        auth: { token: token },
        query: { token: token },
        withCredentials: true,
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
        timeout: 5000
      });

      this.socket.on('connect', () => {
        console.log('[GroupSocket] Connesso al server WebSocket con ID socket:', this.socket.id);
        this.isConnected.set(true);

        this.socket.emit('session:join', { sessionCode: code }, (res: any) => {
          this.handleJoinResponse(res, code);
        });
      });

      // Sincronizzazione automatica broadcast dell'intera lista dal server
      this.socket.on('participants:updated', (updatedList: any[]) => {
        console.log('[GroupSocket] Ricevuto aggiornamento partecipanti in tempo reale:', updatedList);
        if (Array.isArray(updatedList)) {
          this.participants.set(updatedList);
        }
      });

      // Evento singolo: partecipante entrato
      this.socket.on('participant:joined', (data: any) => {
        console.log('[GroupSocket] Partecipante entrato:', data);
        this.participants.update(prev => {
          const matchIndex = prev.findIndex(p => p.userId === data.userId || p.id === data.userId || p.email === data.email);
          if (matchIndex >= 0) {
            const copy = [...prev];
            copy[matchIndex] = { ...copy[matchIndex], isOnline: true };
            return copy;
          }
          return [...prev, {
            userId: data.userId,
            id: data.userId,
            name: data.name,
            email: data.email,
            role: data.role,
            isOnline: true,
            joinedAt: new Date().toISOString()
          }];
        });
      });

      // Evento singolo: partecipante uscito
      this.socket.on('participant:left', (data: any) => {
        console.log('[GroupSocket] Partecipante uscito:', data);
        this.participants.update(prev =>
          prev.map(p => {
            const isMatch = (data.userId && (p.userId === data.userId || p.id === data.userId)) ||
                            (data.email && p.email === data.email);
            return isMatch ? { ...p, isOnline: false } : p;
          })
        );
      });

      // La visita è stata avviata dal docente
      this.socket.on('session:started', (data: any) => {
        console.log('[GroupSocket] Ricevuto evento session:started:', data);
        if (typeof data?.currentStepIndex === 'number') {
          this.currentStepIndex.set(data.currentStepIndex);
        }
        this.sessionStartedCallbacks.forEach(cb => {
          try { cb(data); } catch (e) { console.error(e); }
        });
      });

      // Cambio tappa da parte del docente
      this.socket.on('session:step-changed', (data: { stepIndex: number; activeItem?: any }) => {
        console.log('[GroupSocket] Ricevuto evento session:step-changed:', data);
        if (typeof data.stepIndex === 'number') {
          this.currentStepIndex.set(data.stepIndex);
        }
        this.stepChangedCallbacks.forEach(cb => {
          try { cb(data); } catch (e) { console.error(e); }
        });
      });

      // Blocco / sblocco navigazione libera
      this.socket.on('session:lock-toggled', (data: { isLocked: boolean }) => {
        console.log('[GroupSocket] Ricevuto evento session:lock-toggled:', data);
        this.isLocked.set(data.isLocked);
        this.lockToggledCallbacks.forEach(cb => {
          try { cb(data); } catch (e) { console.error(e); }
        });
      });

      // Conclusione definitiva sessione
      this.socket.on('session:ended', (data: { message?: string }) => {
        console.log('[GroupSocket] Ricevuto evento session:ended:', data);
        this.sessionEndedCallbacks.forEach(cb => {
          try { cb(data); } catch (e) { console.error(e); }
        });
      });

      // Monitoraggio ascolto audio studenti
      this.socket.on('session:students-audio-status', (summary: StudentsAudioSummary) => {
        console.log('[GroupSocket] Ricevuto aggiornamento stato ascolto studenti:', summary);
        this.studentsAudioSummary.set(summary);
        this.studentsAudioStatusCallbacks.forEach(cb => {
          try { cb(summary); } catch (e) { console.error(e); }
        });
      });

      // Ricezione avvio quiz finale
      this.socket.on('session:quiz-started', (data: any) => {
        console.log('[GroupSocket] Ricevuto evento session:quiz-started:', data);
        this.activeQuiz.set(data.quiz);
        this.quizState.set('in_progress');
        this.quizStartedCallbacks.forEach(cb => {
          try { cb(data); } catch (e) { console.error(e); }
        });
      });

      // Notifica sottomissione quiz studente
      this.socket.on('session:quiz-student-submitted', (data: any) => {
        console.log('[GroupSocket] Ricevuto evento session:quiz-student-submitted:', data);
        this.quizStudentSubmittedCallbacks.forEach(cb => {
          try { cb(data); } catch (e) { console.error(e); }
        });
      });

      // Ricezione conclusione quiz e risultati
      this.socket.on('session:quiz-ended', (data: any) => {
        console.log('[GroupSocket] Ricevuto evento session:quiz-ended:', data);
        this.quizState.set('completed');
        this.quizEndedCallbacks.forEach(cb => {
          try { cb(data); } catch (e) { console.error(e); }
        });
      });

      // Ricezione nuovi messaggi / domande nella chat di gruppo
      this.socket.on('session:new-message', (data: any) => {
        console.log('[GroupSocket] Ricevuto messaggio chat di gruppo:', data);
        this.groupMessages.update(prev => {
          const exists = prev.some(m => (m.id && data.id && m.id === data.id));
          return exists ? prev : [...prev, data];
        });
        this.newMessageCallbacks.forEach(cb => {
          try { cb(data); } catch (e) { console.error(e); }
        });
      });

      this.socket.on('session:new-question', (data: any) => {
        this.groupMessages.update(prev => {
          const exists = prev.some(m => (m.id && data.id && m.id === data.id));
          return exists ? prev : [...prev, data];
        });
        this.newMessageCallbacks.forEach(cb => {
          try { cb(data); } catch (e) { console.error(e); }
        });
      });

      this.socket.on('disconnect', () => {
        console.log('[GroupSocket] Disconnesso dal server WebSocket');
        this.isConnected.set(false);
      });

      this.socket.on('connect_error', (err: any) => {
        console.warn('[GroupSocket] Errore di connessione WebSocket:', err.message);
      });

    } catch (error) {
      console.warn('[GroupSocket] Impossibile caricare o connettere il WebSocket:', error);
    }
  }

  // Listener registrations
  onSessionStarted(callback: (data: any) => void): () => void {
    this.sessionStartedCallbacks.push(callback);
    return () => {
      this.sessionStartedCallbacks = this.sessionStartedCallbacks.filter(cb => cb !== callback);
    };
  }

  onStepChanged(callback: (data: { stepIndex: number; activeItem?: any }) => void): () => void {
    this.stepChangedCallbacks.push(callback);
    return () => {
      this.stepChangedCallbacks = this.stepChangedCallbacks.filter(cb => cb !== callback);
    };
  }

  onLockToggled(callback: (data: { isLocked: boolean }) => void): () => void {
    this.lockToggledCallbacks.push(callback);
    return () => {
      this.lockToggledCallbacks = this.lockToggledCallbacks.filter(cb => cb !== callback);
    };
  }

  onSessionEnded(callback: (data: { message?: string }) => void): () => void {
    this.sessionEndedCallbacks.push(callback);
    return () => {
      this.sessionEndedCallbacks = this.sessionEndedCallbacks.filter(cb => cb !== callback);
    };
  }

  onStudentsAudioStatus(callback: (summary: StudentsAudioSummary) => void): () => void {
    this.studentsAudioStatusCallbacks.push(callback);
    return () => {
      this.studentsAudioStatusCallbacks = this.studentsAudioStatusCallbacks.filter(cb => cb !== callback);
    };
  }

  onQuizStarted(callback: (data: any) => void): () => void {
    this.quizStartedCallbacks.push(callback);
    return () => {
      this.quizStartedCallbacks = this.quizStartedCallbacks.filter(cb => cb !== callback);
    };
  }

  onQuizStudentSubmitted(callback: (data: any) => void): () => void {
    this.quizStudentSubmittedCallbacks.push(callback);
    return () => {
      this.quizStudentSubmittedCallbacks = this.quizStudentSubmittedCallbacks.filter(cb => cb !== callback);
    };
  }

  onQuizEnded(callback: (data: any) => void): () => void {
    this.quizEndedCallbacks.push(callback);
    return () => {
      this.quizEndedCallbacks = this.quizEndedCallbacks.filter(cb => cb !== callback);
    };
  }

  onNewMessage(callback: (data: any) => void): () => void {
    this.newMessageCallbacks.push(callback);
    return () => {
      this.newMessageCallbacks = this.newMessageCallbacks.filter(cb => cb !== callback);
    };
  }

  // Emitters
  sendGroupMessage(sessionCode: string, text: string, stepIndex?: number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('WebSocket non connesso.'));
      }
      this.socket.emit('session:send-message', { sessionCode, text, stepIndex }, (res: any) => {
        if (res?.success) {
          if (res.message) {
            this.groupMessages.update(prev => {
              const exists = prev.some(m => (m.id && res.message.id && m.id === res.message.id));
              return exists ? prev : [...prev, res.message];
            });
          }
          resolve(res.message || res);
        } else {
          reject(new Error(res?.error || 'Errore invio messaggio.'));
        }
      });
    });
  }
  startQuiz(sessionCode: string, sessionId?: string, quizId?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('WebSocket non connesso.'));
      }
      this.socket.emit('teacher:start-quiz', { sessionCode, sessionId, quizId }, (res: any) => {
        if (res?.success) {
          resolve(res);
        } else {
          reject(new Error(res?.error || 'Impossibile avviare il quiz.'));
        }
      });
    });
  }

  submitQuiz(sessionCode: string, answers: Array<{ questionIndex: number; selectedOption: number }>): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('WebSocket non connesso.'));
      }
      this.socket.emit('student:submit-quiz', { sessionCode, answers }, (res: any) => {
        if (res?.success) {
          resolve(res);
        } else {
          reject(new Error(res?.error || 'Errore invio risposte quiz.'));
        }
      });
    });
  }

  endQuiz(sessionCode: string, sessionId?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('WebSocket non connesso.'));
      }
      this.socket.emit('teacher:end-quiz', { sessionCode, sessionId }, (res: any) => {
        if (res?.success) {
          resolve(res);
        } else {
          reject(new Error(res?.error || 'Errore conclusione quiz.'));
        }
      });
    });
  }
  sendAudioStatus(sessionCode: string, stepIndex: number, status: 'listening' | 'completed' | 'paused' | 'not_started'): void {
    if (this.socket) {
      this.socket.emit('student:audio-status', { sessionCode, stepIndex, status });
    }
  }

  startSession(sessionCode: string, sessionId?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('WebSocket non connesso.'));
      }
      this.socket.emit('teacher:start-session', { sessionCode, sessionId }, (res: any) => {
        if (res?.success) {
          resolve(res);
        } else {
          reject(new Error(res?.error || 'Impossibile avviare la visita.'));
        }
      });
    });
  }

  changeStep(sessionCode: string, sessionId: string, stepIndex: number, activeItem?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('WebSocket non connesso.'));
      }
      this.socket.emit('teacher:step-change', { sessionCode, sessionId, stepIndex, activeItem }, (res: any) => {
        if (res?.success) {
          resolve(res);
        } else {
          reject(new Error(res?.error || 'Errore durante il cambio tappa.'));
        }
      });
    });
  }

  toggleLock(sessionCode: string, sessionId: string, isLocked: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('WebSocket non connesso.'));
      }
      this.socket.emit('teacher:toggle-lock', { sessionCode, sessionId, isLocked }, (res: any) => {
        if (res?.success) {
          resolve(res);
        } else {
          reject(new Error(res?.error || 'Errore modifica blocco navigazione.'));
        }
      });
    });
  }

  endSession(sessionCode: string, sessionId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('WebSocket non connesso.'));
      }
      this.socket.emit('teacher:end-session', { sessionCode, sessionId }, (res: any) => {
        if (res?.success) {
          resolve(res);
        } else {
          reject(new Error(res?.error || 'Errore conclusione sessione.'));
        }
      });
    });
  }

  leaveRoom(sessionCode?: string): void {
    if (this.socket) {
      this.socket.emit('session:leave', { sessionCode });
      this.disconnect();
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected.set(false);
  }
}

