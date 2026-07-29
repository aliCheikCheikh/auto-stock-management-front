import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from '../api/problem-detail.model';

export interface PasswordChangeFailure {
  readonly field: 'currentPassword' | 'newPassword' | null;
  readonly message: string;
}

export function passwordChangeFailureFrom(error: unknown): PasswordChangeFailure {
  if (!(error instanceof HttpErrorResponse)) {
    return unknownFailure();
  }

  const problem = problemDetailFrom(error.error);
  if (problem?.code === 'CURRENT_PASSWORD_INCORRECT') {
    return { field: 'currentPassword', message: 'Le mot de passe actuel est incorrect.' };
  }

  const currentPasswordError = problem?.errors?.find(
    (validationError) => validationError.field === 'currentPassword'
  );
  if (currentPasswordError) {
    return { field: 'currentPassword', message: currentPasswordError.message };
  }

  const newPasswordError = problem?.errors?.find(
    (validationError) => validationError.field === 'newPassword'
  );
  if (newPasswordError) {
    return { field: 'newPassword', message: newPasswordError.message };
  }

  if (problem?.code === 'INVALID_USER_DATA' || error.status === 400) {
    return {
      field: 'newPassword',
      message: problem?.detail ?? 'Le nouveau mot de passe n’est pas valide.',
    };
  }
  return unknownFailure();
}

function problemDetailFrom(value: unknown): ProblemDetail | null {
  return value !== null && typeof value === 'object' ? (value as ProblemDetail) : null;
}

function unknownFailure(): PasswordChangeFailure {
  return {
    field: null,
    message: 'Impossible de changer le mot de passe. Réessayez.',
  };
}
