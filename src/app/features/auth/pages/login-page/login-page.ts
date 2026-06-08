import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/notifications/notification.service';
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
  private readonly router = inject(Router);

  isSubmitting = false;


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

  onSubmit(): void {
    if (this.isSubmitting) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const credentials = this.form.getRawValue();
    this.isSubmitting = true;
    this.authService.login(credentials).subscribe({
      next: (user) => {
        this.notificationService.success(`Connexion reussie`);
        this.isSubmitting = false;
        this.router.navigate(['/products']);
      },
      error: (error:unknown) => {
        this.notificationService.error('Connexion échouée. Veuillez vérifier vos identifiants et réessayer.');
        this.isSubmitting = false;
      }
    });

  }
}
