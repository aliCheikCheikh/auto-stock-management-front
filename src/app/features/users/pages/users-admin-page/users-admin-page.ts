import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { ConfirmDialog } from '../../../../shared/ui/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { Spinner } from '../../../../shared/ui/spinner/spinner';
import {
  UserManagementFailure,
  userManagementFailureFrom,
} from '../../models/user-management-failure';
import { CreateUserRequest, RenameUserRequest, User } from '../../models/user.model';
import { UsersAdminStore } from '../../state/users-admin.store';
import { CreateSellerDialog } from '../../ui/create-seller-dialog/create-seller-dialog';
import { OneTimePasswordDialog } from '../../ui/one-time-password-dialog/one-time-password-dialog';
import { RenameUserDialog } from '../../ui/rename-user-dialog/rename-user-dialog';
import { UsersList } from '../../ui/users-list/users-list';

type ConfirmationKind = 'deactivate' | 'reset-password';

interface UserConfirmation {
  readonly kind: ConfirmationKind;
  readonly user: User;
}

interface OneTimePassword {
  readonly value: string;
  readonly recipientName: string;
}

@Component({
  selector: 'app-users-admin-page',
  imports: [
    ConfirmDialog,
    CreateSellerDialog,
    EmptyState,
    OneTimePasswordDialog,
    RenameUserDialog,
    Spinner,
    UsersList,
  ],
  providers: [UsersAdminStore],
  templateUrl: './users-admin-page.html',
  styleUrl: './users-admin-page.scss',
})
export class UsersAdminPage implements OnInit {
  readonly store = inject(UsersAdminStore);
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  readonly currentUserId = computed(() => this.authService.currentUser()?.userId ?? null);
  readonly searchTerm = signal('');
  readonly filteredUsers = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase('fr');
    if (!query) return this.store.users();
    return this.store
      .users()
      .filter(
        (user) =>
          user.displayName.toLocaleLowerCase('fr').includes(query) ||
          user.email.toLocaleLowerCase('fr').includes(query)
      );
  });

  readonly createDialogOpen = signal(false);
  readonly createFailure = signal<UserManagementFailure | null>(null);
  readonly userToRename = signal<User | null>(null);
  readonly renameFailure = signal<UserManagementFailure | null>(null);
  readonly confirmation = signal<UserConfirmation | null>(null);
  readonly confirmationFailure = signal<UserManagementFailure | null>(null);
  readonly oneTimePassword = signal<OneTimePassword | null>(null);

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.store.loadUsers().subscribe({
      error: (error: unknown) => {
        const failure = userManagementFailureFrom(error);
        this.handleSessionFailure(failure);
      },
    });
  }

  openCreateDialog(): void {
    this.createFailure.set(null);
    this.createDialogOpen.set(true);
  }

  closeCreateDialog(): void {
    if (!this.store.isPending('create')) {
      this.createDialogOpen.set(false);
      this.createFailure.set(null);
    }
  }

  createSeller(request: CreateUserRequest): void {
    if (this.store.isPending('create')) return;
    this.createFailure.set(null);

    this.store.createSeller(request).subscribe({
      next: (response) => {
        this.createDialogOpen.set(false);
        this.notifications.success('Le compte vendeur a été créé.');
        this.oneTimePassword.set({
          value: response.temporaryPassword,
          recipientName: response.user.displayName,
        });
      },
      error: (error: unknown) => this.handleCreateFailure(error),
    });
  }

  openRenameDialog(user: User): void {
    this.renameFailure.set(null);
    this.userToRename.set(user);
  }

  closeRenameDialog(): void {
    const user = this.userToRename();
    if (!user || !this.store.isPending('rename', user.userId)) {
      this.userToRename.set(null);
      this.renameFailure.set(null);
    }
  }

  renameUser(request: RenameUserRequest): void {
    const user = this.userToRename();
    if (!user || this.store.isPending('rename', user.userId)) return;
    this.renameFailure.set(null);

    this.store.renameUser(user, request).subscribe({
      next: () => {
        this.userToRename.set(null);
        this.notifications.success('Le nom du compte a été mis à jour.');
      },
      error: (error: unknown) => this.handleRenameFailure(error),
    });
  }

  requestDeactivation(user: User): void {
    this.confirmationFailure.set(null);
    this.confirmation.set({ kind: 'deactivate', user });
  }

  requestPasswordReset(user: User): void {
    if (user.role !== 'SELLER') return;
    this.confirmationFailure.set(null);
    this.confirmation.set({ kind: 'reset-password', user });
  }

  cancelConfirmation(): void {
    if (!this.isConfirmationSubmitting()) {
      this.confirmation.set(null);
      this.confirmationFailure.set(null);
    }
  }

  confirmAction(): void {
    const confirmation = this.confirmation();
    if (!confirmation || this.isConfirmationSubmitting()) return;
    this.confirmationFailure.set(null);

    if (confirmation.kind === 'deactivate') {
      this.deactivateUser(confirmation.user);
    } else {
      this.resetPassword(confirmation.user);
    }
  }

  reactivateUser(user: User): void {
    if (this.store.isPending('reactivate', user.userId)) return;
    this.store.reactivateUser(user).subscribe({
      next: () => this.notifications.success(`Le compte de ${user.displayName} a été réactivé.`),
      error: (error: unknown) => this.handleListActionFailure(error),
    });
  }

  closeOneTimePassword(): void {
    // Le secret n'existe que dans ce signal. Le vider rend sa récupération
    // impossible depuis l'état de l'application après fermeture du dialogue.
    this.oneTimePassword.set(null);
  }

  confirmationTitle(): string {
    return this.confirmation()?.kind === 'reset-password'
      ? 'Réinitialiser le mot de passe ?'
      : 'Désactiver ce compte ?';
  }

  confirmationMessage(): string {
    const confirmation = this.confirmation();
    if (!confirmation) return '';
    const { user } = confirmation;
    if (confirmation.kind === 'reset-password') {
      return `Les sessions de ${user.displayName} (${user.email}) seront fermées. Un nouveau mot de passe temporaire sera affiché une seule fois.`;
    }
    return `${user.displayName} (${user.email}) perdra immédiatement l’accès. Son historique restera conservé.`;
  }

  confirmationLabel(): string {
    return this.confirmation()?.kind === 'reset-password' ? 'Réinitialiser' : 'Désactiver';
  }

  isConfirmationSubmitting(): boolean {
    const confirmation = this.confirmation();
    if (!confirmation) return false;
    return this.store.isPending(confirmation.kind, confirmation.user.userId);
  }

  private deactivateUser(user: User): void {
    this.store.deactivateUser(user).subscribe({
      next: () => {
        this.confirmation.set(null);
        this.notifications.success(`Le compte de ${user.displayName} a été désactivé.`);
      },
      error: (error: unknown) => this.handleConfirmationFailure(error),
    });
  }

  private resetPassword(user: User): void {
    this.store.resetPassword(user).subscribe({
      next: (response) => {
        this.confirmation.set(null);
        this.notifications.success('Le mot de passe temporaire a été renouvelé.');
        this.oneTimePassword.set({
          value: response.temporaryPassword,
          recipientName: user.displayName,
        });
      },
      error: (error: unknown) => this.handleConfirmationFailure(error),
    });
  }

  private handleCreateFailure(error: unknown): void {
    const failure = userManagementFailureFrom(error);
    if (this.handleSessionFailure(failure)) return;
    this.createFailure.set(failure);
  }

  private handleRenameFailure(error: unknown): void {
    const failure = userManagementFailureFrom(error);
    if (this.handleSessionFailure(failure)) return;
    if (failure.kind === 'not-found') {
      this.userToRename.set(null);
      this.notifications.info(failure.message);
      this.loadUsers();
      return;
    }
    this.renameFailure.set(failure);
  }

  private handleConfirmationFailure(error: unknown): void {
    const failure = userManagementFailureFrom(error);
    if (this.handleSessionFailure(failure)) return;
    if (failure.kind === 'not-found') {
      this.confirmation.set(null);
      this.notifications.info(failure.message);
      this.loadUsers();
      return;
    }
    this.confirmationFailure.set(failure);
  }

  private handleListActionFailure(error: unknown): void {
    const failure = userManagementFailureFrom(error);
    if (this.handleSessionFailure(failure)) return;
    if (failure.kind === 'not-found') this.loadUsers();
    this.notifications.error(failure.message);
  }

  private handleSessionFailure(failure: UserManagementFailure): boolean {
    if (failure.kind === 'unauthorized') {
      this.authService.clearSession();
      void this.router.navigate(['/login']);
      return true;
    }
    if (failure.kind === 'forbidden') {
      this.notifications.info(failure.message);
      this.authService.me().subscribe({
        next: () => void this.router.navigate(['/products']),
        error: () => {
          this.authService.clearSession();
          void this.router.navigate(['/login']);
        },
      });
      return true;
    }
    return false;
  }
}
