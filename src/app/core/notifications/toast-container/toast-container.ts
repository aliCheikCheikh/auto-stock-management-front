import { Component, inject } from '@angular/core';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-toast-container',
  imports: [],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.scss',
})
export class ToastContainer {
  private readonly notificationService = inject(NotificationService);

  readonly toasts = this.notificationService.toasts;

  dismiss(id: number): void {
    this.notificationService.dismiss(id);
  }

}
