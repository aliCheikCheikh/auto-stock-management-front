import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { trapTabKey } from '../../../../shared/utils/focus-trap';

@Component({
  selector: 'app-one-time-password-dialog',
  templateUrl: './one-time-password-dialog.html',
  styleUrl: './one-time-password-dialog.scss',
})
export class OneTimePasswordDialog implements OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly previouslyFocused = document.activeElement as HTMLElement | null;

  readonly password = input.required<string>();
  readonly recipientName = input.required<string>();
  readonly closed = output<void>();
  readonly copied = signal(false);
  readonly copyFailed = signal(false);

  constructor() {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>('[autofocus]')?.focus());
  }

  async copyPassword(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.password());
      this.copied.set(true);
      this.copyFailed.set(false);
    } catch {
      this.copied.set(false);
      this.copyFailed.set(true);
    }
  }

  selectPassword(inputElement: HTMLInputElement): void {
    inputElement.select();
  }

  trapFocus(dialog: HTMLElement, event: KeyboardEvent): void {
    if (event.key === 'Tab') trapTabKey(dialog, event);
  }

  ngOnDestroy(): void {
    this.previouslyFocused?.focus();
  }
}
