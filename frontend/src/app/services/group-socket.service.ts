import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    io?: any;
  }
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
        reconnectionAttempts: 3,
        reconnectionDelay: 5000,
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
