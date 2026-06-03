export type ToastType = 'success' | 'error';

export interface Toast {
    readonly id: number;
    readonly type: ToastType;
    readonly message: string;
}