import { Component, input, output } from '@angular/core';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.html',
  styleUrl: './users-list.scss',
})
export class UsersList {
  readonly users = input.required<readonly User[]>();
  readonly currentUserId = input<string | null>(null);
  readonly activeOwnerCount = input.required<number>();
  readonly pendingActionKeys = input.required<ReadonlySet<string>>();

  readonly renameRequested = output<User>();
  readonly deactivationRequested = output<User>();
  readonly reactivationRequested = output<User>();
  readonly passwordResetRequested = output<User>();

  isSoleActiveOwner(user: User): boolean {
    return user.role === 'OWNER' && user.active && this.activeOwnerCount() === 1;
  }

  isPending(action: string, user: User): boolean {
    return this.pendingActionKeys().has(`${action}:${user.userId}`);
  }

  initials(user: User): string {
    const parts = user.displayName.trim().split(/\s+/).filter(Boolean);
    const initials = parts.slice(0, 2).map((part) => part.charAt(0)).join('');
    return (initials || user.email.charAt(0)).toLocaleUpperCase('fr');
  }
}
