import { Component, inject, signal } from '@angular/core';
import { NotificationService } from '../notification.service';

const LEAVE_ANIMATION_MS = 140;

@Component({
  selector: 'app-toast-container',
  imports: [],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.scss',
})
export class ToastContainer {
  private readonly notificationService = inject(NotificationService);

  readonly toasts = this.notificationService.toasts;

  // Toasts en cours de sortie : gardés dans la liste le temps du fondu.
  private readonly leaving = signal<ReadonlySet<number>>(new Set());

  isLeaving(id: number): boolean {
    return this.leaving().has(id);
  }

  close(id: number): void {
    if (this.leaving().has(id)) {
      return;
    }

    this.leaving.update((ids) => new Set(ids).add(id));
    setTimeout(() => {
      this.notificationService.dismiss(id);
      this.leaving.update((ids) => {
        const next = new Set(ids);
        next.delete(id);
        return next;
      });
    }, LEAVE_ANIMATION_MS);
  }

}
