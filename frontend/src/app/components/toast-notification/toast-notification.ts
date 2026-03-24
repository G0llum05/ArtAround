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
    this.subscription = this.alertService.toast$.subscribe(toast => {
      this.toasts.push(toast);
      this.cdr.detectChanges();
      setTimeout(() => this.removeToast(toast), 6000);
    });
  }

  removeToast(toastToRemove: ToastMessage) {
    this.toasts = this.toasts.filter(toast => toast !== toastToRemove);
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  getCloseIcon(type: 'successful' | 'error' | 'warning'): string {
    switch (type) {
      case 'error':
        return 'images/x-error.svg';
      case 'warning':
        return 'images/x-warning.svg';
      case 'successful':
        return 'images/x-success.svg';
      default:
        return 'images/x-success.svg'; // Default icon
    }
  }

  getCssClass(toast: ToastMessage): { [key: string]: boolean } {
    return {
      'toast': true,
      'error': toast.type === 'error',
      'warning': toast.type === 'warning',
      'successful': toast.type === 'successful'
    };
  }
}
