import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastMessage {
  message: string;
  type: 'error' | 'warning' | 'success';
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private toastSubject = new Subject<ToastMessage>();
  toast$ = this.toastSubject.asObservable();

  constructor() {
    console.log('[AlertService] Service instance created.');
  }

  error(message: string) {
    console.log('[AlertService] .error() called:', message);
    this.toastSubject.next({ message, type: 'error' });
  }

  success(message: string) {
    console.log('[AlertService] .success() called:', message);
    this.toastSubject.next({ message, type: 'success' });
  }

  warning(message: string) {
    console.log('[AlertService] .warning() called:', message);
    this.toastSubject.next({ message, type: 'warning' });
  }

  show(message: string, type?: 'success' | 'warning' | 'error' | string) {
    console.log('[AlertService] .show() called with message:', message, 'and type:', type);
    if (type === 'error') {
      this.error(message);
    } else if (type === 'warning') {
      this.warning(message);
    } else {
      this.success(message);
    }
  }

  confirm(message: string): boolean {
    return confirm(message);
  }

  blockingAlert(message: string) {
    alert(message);
  }
}
