import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService, ToastMessage } from '../../services/alert.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-notification.component.html',
  styleUrl: './toast-notification.component.css',
})
export class ToastNotification implements OnDestroy {
  toasts: ToastMessage[] = [];
  private subscription: Subscription;

  constructor(private alertService: AlertService) {
    this.subscription = this.alertService.toast$.subscribe(toast => {
      this.toasts.push(toast);
      setTimeout(() => this.removeToast(toast), 6000);
    });
  }

  removeToast(toastToRemove: ToastMessage) {
    this.toasts = this.toasts.filter(toast => toast !== toastToRemove);
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
        return 'images/x-success.svg';
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
