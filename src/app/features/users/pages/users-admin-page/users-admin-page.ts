import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { UsersApiService } from '../../data-access/users-api.service';
import { User } from '../../models/user.model';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { ConfirmDialog } from '../../../../shared/ui/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'app-users-admin-page',
  imports: [ReactiveFormsModule, ConfirmDialog, EmptyState],
  templateUrl: './users-admin-page.html',
  styleUrl: './users-admin-page.scss',
})
export class UsersAdminPage implements OnInit {
  private readonly usersApi = inject(UsersApiService);
  private readonly notificationService = inject(NotificationService);

  readonly users = signal<User[]>([]);
  // Id du compte dont on est en train de réinitialiser le mot de passe (formulaire inline).
  readonly resettingUserId = signal<string | null>(null);
  // Compte en attente de confirmation de désactivation (action destructive).
  readonly userToDeactivate = signal<User | null>(null);
  isSubmitting = false;

  readonly createForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    temporaryPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8), Validators.maxLength(72)],
    }),
  });

  readonly resetForm = new FormGroup({
    temporaryPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8), Validators.maxLength(72)],
    }),
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  createSeller(formDirective: FormGroupDirective): void {
    if (this.isSubmitting) {
      return;
    }
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.usersApi.createSeller(this.createForm.getRawValue()).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.notificationService.success('Compte vendeur créé.');
        formDirective.resetForm();
        this.loadUsers();
      },
      error: (error: unknown) => {
        this.isSubmitting = false;
        this.notificationService.error(this.createErrorMessage(error));
      },
    });
  }

  askDeactivation(user: User): void {
    this.userToDeactivate.set(user);
  }

  cancelDeactivation(): void {
    this.userToDeactivate.set(null);
  }

  confirmDeactivation(): void {
    const user = this.userToDeactivate();
    if (!user) {
      return;
    }
    this.usersApi.deactivateUser(user.userId).subscribe({
      next: () => {
        this.notificationService.success(`Compte ${user.email} désactivé.`);
        this.userToDeactivate.set(null);
        this.loadUsers();
      },
      error: () => {
        this.notificationService.error('Impossible de désactiver ce compte.');
        this.userToDeactivate.set(null);
      },
    });
  }

  startReset(user: User): void {
    this.resetForm.reset();
    this.resettingUserId.set(user.userId);
  }

  cancelReset(): void {
    this.resettingUserId.set(null);
  }

  submitReset(): void {
    const userId = this.resettingUserId();
    if (userId === null) {
      return;
    }
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.usersApi.resetPassword(userId, this.resetForm.getRawValue()).subscribe({
      next: () => {
        this.notificationService.success('Mot de passe réinitialisé.');
        this.resettingUserId.set(null);
        this.loadUsers();
      },
      error: () => this.notificationService.error('Impossible de réinitialiser le mot de passe.'),
    });
  }

  private loadUsers(): void {
    this.usersApi.listUsers().subscribe({
      next: (users) => this.users.set(users),
      error: () => this.notificationService.error('Impossible de charger les comptes.'),
    });
  }

  private createErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 409) {
      return 'Un compte avec cet email existe déjà.';
    }
    return 'Impossible de créer le compte.';
  }
}
