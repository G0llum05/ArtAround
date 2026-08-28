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

  // Callbacks per eventi
  private sessionStartedCallbacks: Array<(data: any) => void> = [];
  private stepChangedCallbacks: Array<(data: { stepIndex: number; activeItem?: any }) => void> = [];
  private lockToggledCallbacks: Array<(data: { isLocked: boolean }) => void> = [];
  private sessionEndedCallbacks: Array<(data: { message?: string }) => void> = [];
  private studentsAudioStatusCallbacks: Array<(summary: StudentsAudioSummary) => void> = [];

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

  async connect(sessionCode: string): Promise<void> {
    if (this.socket && this.isConnected()) {
      // Già connesso, unisciti alla stanza se necessario
      this.socket.emit('session:join', { sessionCode: sessionCode.toUpperCase().trim() });
      return;
    }

    if (this.socket) {
      this.disconnect();
    }

    try {
      const ioFactory = await this.loadSocketScript();
      const token = this.authService.getAccessToken() || localStorage.getItem('artaround_accessToken');
      const backendUrl = this.getBackendUrl();

      console.log(`[GroupSocket] Connessione a ${backendUrl} per la stanza ${sessionCode}...`);

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

        // Entra nella stanza di visita
        this.socket.emit('session:join', { sessionCode: sessionCode.toUpperCase().trim() }, (res: any) => {
          if (res?.success && res.session) {
            console.log('[GroupSocket] Entrato nella stanza con successo:', res.session);
            if (res.session.participants) {
              this.participants.set(res.session.participants);
            }
            if (typeof res.session.currentStepIndex === 'number') {
              this.currentStepIndex.set(res.session.currentStepIndex);
            }
          }
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

  // Emitters
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

