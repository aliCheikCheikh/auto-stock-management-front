import { UserRole } from '../../../core/auth/auth.model';

export interface User {
  readonly userId: string;
  readonly email: string;
  readonly role: UserRole;
  readonly passwordTemporary: boolean;
  readonly active: boolean;
}

export interface CreateUserRequest {
  readonly email: string;
  readonly temporaryPassword: string;
}

export interface ResetPasswordRequest {
  readonly temporaryPassword: string;
}
