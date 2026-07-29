import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { trapTabKey } from '../../../../shared/utils/focus-trap';
import { UserManagementFailure } from '../../models/user-management-failure';
import { CreateUserRequest } from '../../models/user.model';
import {
  createSellerForm,
  displayNameError,
  emailError,
  validateUserForm,
} from '../../utils/user-form';

@Component({
  selector: 'app-create-seller-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './create-seller-dialog.html',
  styleUrl: './create-seller-dialog.scss',
})
export class CreateSellerDialog implements OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly previouslyFocused = document.activeElement as HTMLElement | null;

  readonly isSubmitting = input(false);
  readonly failure = input<UserManagementFailure | null>(null);
  readonly submitted = output<CreateUserRequest>();
  readonly cancelled = output<void>();
  readonly formChanged = output<void>();

  readonly form = createSellerForm();

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.formChanged.emit());
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>('[autofocus]')?.focus());
  }

  submit(): void {
    if (this.isSubmitting() || !validateUserForm(this.form)) return;
    const value = this.form.getRawValue();
    this.submitted.emit({
      displayName: value.displayName.trim(),
      email: value.email.trim(),
    });
  }

  cancel(): void {
    if (!this.isSubmitting()) this.cancelled.emit();
  }

  displayNameError(): string {
    return displayNameError(this.form.controls.displayName, this.failure());
  }

  emailError(): string {
    return emailError(this.form.controls.email, this.failure());
  }

  generalError(): string {
    const failure = this.failure();
    return failure && Object.keys(failure.fieldErrors).length === 0 ? failure.message : '';
  }

  trapFocus(dialog: HTMLElement, event: KeyboardEvent): void {
    if (event.key === 'Tab') trapTabKey(dialog, event);
  }

  ngOnDestroy(): void {
    this.previouslyFocused?.focus();
  }
}
