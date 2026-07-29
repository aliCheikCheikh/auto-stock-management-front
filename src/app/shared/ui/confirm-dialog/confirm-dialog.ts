import { afterNextRender, Component, ElementRef, inject, input, OnDestroy, output } from '@angular/core';
import { trapTabKey } from '../../utils/focus-trap';

/**
 * Dialogue de confirmation. L'habillage (voile, carte, titre, pied d'actions)
 * vient du gabarit `.dialog-*` du design system : ce composant n'ajoute aucun
 * style local.
 */
@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog implements OnDestroy {
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly previouslyFocused = document.activeElement as HTMLElement | null;

  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly errorMessage = input('');
  readonly confirmLabel = input('Confirmer');
  readonly cancelLabel = input('Annuler');
  readonly confirmTone = input<'primary' | 'danger'>('danger');
  readonly isSubmitting = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  constructor() {
    afterNextRender(() =>
      this.host.nativeElement.querySelector<HTMLElement>('[autofocus]')?.focus()
    );
  }

  confirm(): void {
    if (!this.isSubmitting()) {
      this.confirmed.emit();
    }
  }

  cancel(): void {
    if (!this.isSubmitting()) {
      this.cancelled.emit();
    }
  }

  trapFocus(dialog: HTMLElement, event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      trapTabKey(dialog, event);
    }
  }

  ngOnDestroy(): void {
    this.previouslyFocused?.focus();
  }
}
