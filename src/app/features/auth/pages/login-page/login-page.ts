import { afterNextRender, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { LoadingService } from '../../../../core/loading/loading.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly loading = inject(LoadingService);
  private readonly router = inject(Router);

  private readonly emailInput = viewChild<ElementRef<HTMLInputElement>>('emailInput');

  readonly isSubmitting = signal(false);
  readonly showPassword = signal(false);
  // L'échec s'affiche DANS le formulaire : c'est là que l'utilisateur regarde.
  // Le toast reste en complément pour les utilisateurs déjà partis ailleurs.
  readonly errorMessage = signal('');

  readonly form = new FormGroup({
    email: new FormControl('',
      {
        nonNullable: true,
        validators: [Validators.required, Validators.email]
      }),
    password: new FormControl('',
      {
        nonNullable: true,
        validators: [Validators.required]
      }),
  });

  constructor() {
    // Focus sur l'email à l'ouverture : la saisie commence sans un clic.
    afterNextRender(() => this.emailInput()?.nativeElement.focus());
  }

  togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  onSubmit(): void {
    if (this.isSubmitting()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const credentials = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.errorMessage.set('');
    // Action explicite → overlay bloquant (masque le formulaire pendant l'appel).
    this.loading.startBlocking();
    this.authService.login(credentials).subscribe({
      next: (user) => {
        this.notificationService.success('Connexion réussie');
        this.isSubmitting.set(false);
        this.loading.stopBlocking();
        this.router.navigate([user.passwordTemporary ? '/change-password' : '/products']);
      },
      error: () => {
        const message = 'Connexion échouée. Vérifiez vos identifiants et réessayez.';
        this.errorMessage.set(message);
        this.notificationService.error(message);
        this.isSubmitting.set(false);
        this.loading.stopBlocking();
        this.emailInput()?.nativeElement.focus();
      }
    });
  }
}
