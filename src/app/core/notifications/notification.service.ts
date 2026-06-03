import { Injectable, signal, Signal } from "@angular/core";
import { Toast, ToastType } from "./toast.model";

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

    dismiss(id: number): void {
        this._toasts.update(toasts => toasts.filter(t => t.id !== id));
    }

    private show(type: ToastType, message: string): void {
        const id = this.nextId++;
        this._toasts.update((list) => [...list, { id, type, message }]);

        setTimeout(() => {
            this.dismiss(id);
        }, 5000);
    }

}