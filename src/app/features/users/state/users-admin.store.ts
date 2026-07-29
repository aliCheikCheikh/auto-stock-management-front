import { computed, inject, Injectable, signal } from '@angular/core';
import { defer, finalize, Observable, tap } from 'rxjs';
import { UsersApiService } from '../data-access/users-api.service';
import {
  CreatedUserResponse,
  CreateUserRequest,
  RenameUserRequest,
  TemporaryPasswordResponse,
  User,
} from '../models/user.model';

export type UsersLoadState = 'loading' | 'ready' | 'error';
export type UserAction = 'create' | 'rename' | 'deactivate' | 'reactivate' | 'reset-password';

@Injectable()
export class UsersAdminStore {
  private readonly usersApi = inject(UsersApiService);
  private readonly _pendingKeys = signal<ReadonlySet<string>>(new Set());

  readonly loadState = signal<UsersLoadState>('loading');
  readonly users = signal<readonly User[]>([]);
  readonly pendingKeys = this._pendingKeys.asReadonly();
  readonly totalCount = computed(() => this.users().length);
  readonly activeCount = computed(() => this.users().filter((user) => user.active).length);
  readonly inactiveCount = computed(() => this.totalCount() - this.activeCount());
  readonly activeOwnerCount = computed(
    () => this.users().filter((user) => user.role === 'OWNER' && user.active).length
  );

  loadUsers(): Observable<readonly User[]> {
    this.loadState.set('loading');
    return this.usersApi.listUsers().pipe(
      tap({
        next: (users) => {
          this.users.set(users);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      })
    );
  }

  createSeller(request: CreateUserRequest): Observable<CreatedUserResponse> {
    return this.track('create', this.usersApi.createSeller(request)).pipe(
      tap((response) => this.users.update((users) => [...users, response.user]))
    );
  }

  renameUser(user: User, request: RenameUserRequest): Observable<User> {
    return this.track('rename', this.usersApi.renameUser(user.userId, request), user.userId).pipe(
      tap((renamedUser) => this.replaceUser(renamedUser))
    );
  }

  deactivateUser(user: User): Observable<void> {
    return this.track('deactivate', this.usersApi.deactivateUser(user.userId), user.userId).pipe(
      tap(() => this.replaceUser({ ...user, active: false }))
    );
  }

  reactivateUser(user: User): Observable<User> {
    return this.track('reactivate', this.usersApi.reactivateUser(user.userId), user.userId).pipe(
      tap((reactivatedUser) => this.replaceUser(reactivatedUser))
    );
  }

  resetPassword(user: User): Observable<TemporaryPasswordResponse> {
    return this.track(
      'reset-password',
      this.usersApi.resetPassword(user.userId),
      user.userId
    ).pipe(
      tap(() => this.replaceUser({ ...user, passwordChangeRequired: true }))
    );
  }

  isPending(action: UserAction, userId?: string): boolean {
    return this.pendingKeys().has(this.actionKey(action, userId));
  }

  private track<T>(action: UserAction, request: Observable<T>, userId?: string): Observable<T> {
    const key = this.actionKey(action, userId);
    return defer(() => {
      this._pendingKeys.update((keys) => new Set(keys).add(key));
      return request.pipe(
        finalize(() =>
          this._pendingKeys.update((keys) => {
            const nextKeys = new Set(keys);
            nextKeys.delete(key);
            return nextKeys;
          })
        )
      );
    });
  }

  private actionKey(action: UserAction, userId?: string): string {
    return userId ? `${action}:${userId}` : action;
  }

  private replaceUser(updatedUser: User): void {
    this.users.update((users) =>
      users.map((user) => (user.userId === updatedUser.userId ? updatedUser : user))
    );
  }
}
