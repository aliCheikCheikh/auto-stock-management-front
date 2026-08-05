import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { landingRouteFor } from '../../../../core/auth/auth.model';
import { passwordChangeFailureFrom } from '../../../../core/auth/password-change-failure';
import { NotificationService } from '../../../../core/notifications/notification.service';

@Component({
  selector: 'app-change-password-page',
  imports: [ReactiveFormsModule],
  templateUrl: './change-password-page.html',
  styleUrl: './change-password-page.scss',
})
export class ChangePasswordPage {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly showCurrentPassword = signal(false);
  readonly showNewPassword = signal(false);
  readonly currentPasswordServerError = signal('');
  readonly newPasswordServerError = signal('');
  readonly submissionError = signal('');

  readonly form = new FormGroup({
    currentPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    newPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8), Validators.maxLength(72)],
    }),
  });

  constructor() {
    this.form.controls.currentPassword.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.currentPasswordServerError.set(''));
    this.form.controls.newPassword.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.newPasswordServerError.set(''));
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.submissionError.set(''));
  }

  toggleCurrentPassword(): void {
    this.showCurrentPassword.update((visible) => !visible);
  }

  toggleNewPassword(): void {
    this.showNewPassword.update((visible) => !visible);
  }

  currentPasswordError(): string {
    if (this.currentPasswordServerError()) return this.currentPasswordServerError();
    return this.form.controls.currentPassword.touched && this.form.controls.currentPassword.invalid
      ? 'Saisissez votre mot de passe actuel.'
      : '';
  }

  newPasswordError(): string {
    if (this.newPasswordServerError()) return this.newPasswordServerError();
    const control = this.form.controls.newPassword;
    if (!control.touched) return '';
    if (control.hasError('required')) return 'Saisissez un nouveau mot de passe.';
    if (control.hasError('minlength')) return 'Utilisez au moins 8 caractères.';
    if (control.hasError('maxlength')) return 'Limitez le mot de passe à 72 caractères.';
    return '';
  }

  onSubmit(): void {
    if (this.isSubmitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.authService.changePassword(this.form.getRawValue()).subscribe({
      next: () => this.reloadSession(),
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        const failure = passwordChangeFailureFrom(error);
        if (failure.field === 'currentPassword') {
          this.currentPasswordServerError.set(failure.message);
        } else if (failure.field === 'newPassword') {
          this.newPasswordServerError.set(failure.message);
        } else {
          this.submissionError.set(failure.message);
        }
      },
    });
  }

  logout(): void {
    this.authService.logout().subscribe(() => void this.router.navigate(['/login']));
  }

  private reloadSession(): void {
    // /me confirme que le backend a retiré l'obligation de changement avant
    // de rouvrir les écrans métier. Un échec réseau à cette étape ne remet pas
    // en cause le changement déjà effectué : on demande une reconnexion claire.
    this.authService.me().subscribe({
      next: (user) => {
        this.isSubmitting.set(false);
        this.notificationService.success('Votre mot de passe a été mis à jour.');
        void this.router.navigate([landingRouteFor(user)]);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.authService.clearSession();
        this.notificationService.info(
          'Votre mot de passe a été modifié. Reconnectez-vous avec le nouveau mot de passe.'
        );
        void this.router.navigate(['/login']);
      },
    });
  }
}
