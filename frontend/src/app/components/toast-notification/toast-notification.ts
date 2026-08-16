import { Component, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService, ToastMessage } from '../../services/alert.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-notification.html',
  styleUrl: './toast-notification.css',
})
export class ToastNotification implements OnDestroy {
  toasts: ToastMessage[] = [];
  private subscription: Subscription;

  constructor(
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {
    console.log('[ToastNotification] Component initialized, listening to AlertService.toast$');
    this.subscription = this.alertService.toast$.subscribe(toast => {
      console.log('[ToastNotification] Received toast in component:', toast);
      this.toasts.push(toast);
      console.log('[ToastNotification] Current active toasts array:', this.toasts);
      this.cdr.detectChanges();
      setTimeout(() => this.removeToast(toast), 6000);
    });
  }

  removeToast(toastToRemove: ToastMessage) {
    console.log('[ToastNotification] Removing toast:', toastToRemove);
    this.toasts = this.toasts.filter(toast => toast !== toastToRemove);
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    console.log('[ToastNotification] Component destroyed');
    this.subscription.unsubscribe();
  }

  getCloseIcon(type: 'success' | 'error' | 'warning'): string {
    switch (type) {
      case 'error':
        return 'assets/x-error.svg';
      case 'warning':
        return 'assets/x-warning.svg';
      case 'success':
        return 'assets/x-success.svg';
      default:
        return 'assets/x-success.svg'; // Default icon
    }
  }

  getCssClass(toast: ToastMessage): { [key: string]: boolean } {
    return {
      'toast': true,
      'error': toast.type === 'error',
      'warning': toast.type === 'warning',
      'success': toast.type === 'success'
    };
  }
}
