import { UserRole } from '../../../core/auth/auth.model';

export interface User {
  readonly userId: string;
  readonly displayName: string;
  readonly email: string;
  readonly role: UserRole;
  readonly passwordChangeRequired: boolean;
  readonly active: boolean;
}

export interface CreateUserRequest {
  readonly displayName: string;
  readonly email: string;
}

export interface CreatedUserResponse {
  readonly user: User;
  readonly temporaryPassword: string;
}

export interface RenameUserRequest {
  readonly displayName: string;
}

export interface TemporaryPasswordResponse {
  readonly temporaryPassword: string;
}
