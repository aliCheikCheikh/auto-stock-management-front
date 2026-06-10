export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
    readonly id: number;
    readonly type: ToastType;
    readonly message: string;
    /** Durée d'affichage en ms — le compte à rebours est porté par la barre de progression du toast. */
    readonly duration: number;
}
