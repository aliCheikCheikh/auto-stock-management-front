import { Injectable, signal } from "@angular/core";
import { Toast, ToastType } from "./toast.model";

// Erreur plus longue : l'utilisateur doit pouvoir lire et agir.
const TOAST_DURATION_MS: Record<ToastType, number> = {
    success: 4000,
    info: 4000,
    error: 8000,
};

const MAX_TOASTS = 4;

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private readonly _toasts = signal<Toast[]>([]);
    readonly toasts = this._toasts.asReadonly();

    private nextId = 0;

    success(message: string): void {
        this.show('success', message);
    }

    error(message: string): void {
        this.show('error', message);
    }

    info(message: string): void {
        this.show('info', message);
    }

    dismiss(id: number): void {
        this._toasts.update(toasts => toasts.filter(t => t.id !== id));
    }

    private show(type: ToastType, message: string): void {
        const id = this.nextId++;
        const duration = TOAST_DURATION_MS[type];
        // Plus récent en tête de liste (affiché en haut de la pile), pile plafonnée.
        this._toasts.update((list) => [{ id, type, message, duration }, ...list].slice(0, MAX_TOASTS));
    }

}
