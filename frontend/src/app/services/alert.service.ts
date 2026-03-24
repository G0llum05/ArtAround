import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastMessage {
  message: string;
  type: 'error' | 'warning' | 'successful';
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private toastSubject = new Subject<ToastMessage>();
  toast$ = this.toastSubject.asObservable();

  constructor() { }

  error(message: string) {
    this.toastSubject.next({ message, type: 'error' });
  }

  success(message: string) {
    this.toastSubject.next({ message, type: 'successful' });
  }

  warning(message: string) {
    this.toastSubject.next({ message, type: 'warning' });
  }

  confirm(message: string): boolean {
    return confirm(message);
  }

  blockingAlert(message: string) {
    alert(message);
  }
}
