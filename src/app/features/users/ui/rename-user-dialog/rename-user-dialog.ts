import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { trapTabKey } from '../../../../shared/utils/focus-trap';
import { UserManagementFailure } from '../../models/user-management-failure';
import { RenameUserRequest, User } from '../../models/user.model';
import {
  createRenameUserForm,
  displayNameError,
  validateUserForm,
} from '../../utils/user-form';

@Component({
  selector: 'app-rename-user-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './rename-user-dialog.html',
  styleUrl: './rename-user-dialog.scss',
})
export class RenameUserDialog implements OnInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly previouslyFocused = document.activeElement as HTMLElement | null;

  readonly user = input.required<User>();
  readonly isSubmitting = input(false);
  readonly failure = input<UserManagementFailure | null>(null);
  readonly submitted = output<RenameUserRequest>();
  readonly cancelled = output<void>();
  readonly formChanged = output<void>();

  readonly form = createRenameUserForm('');

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.formChanged.emit());
    afterNextRender(() => {
      const inputElement = this.host.nativeElement.querySelector<HTMLInputElement>('[autofocus]');
      inputElement?.focus();
      inputElement?.select();
    });
  }

  ngOnInit(): void {
    this.form.reset({ displayName: this.user().displayName });
  }

  submit(): void {
    if (this.isSubmitting() || !validateUserForm(this.form)) return;
    this.submitted.emit({ displayName: this.form.getRawValue().displayName.trim() });
  }

  cancel(): void {
    if (!this.isSubmitting()) this.cancelled.emit();
  }

  displayNameError(): string {
    return displayNameError(this.form.controls.displayName, this.failure());
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
