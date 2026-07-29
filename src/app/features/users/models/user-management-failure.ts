import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from '../../../core/api/problem-detail.model';

export type UserField = 'displayName' | 'email';

export type UserManagementFailureKind =
  | 'email-already-used'
  | 'not-found'
  | 'last-active-owner'
  | 'owner-password-reset-forbidden'
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'unknown';

export interface UserManagementFailure {
  readonly kind: UserManagementFailureKind;
  readonly message: string;
  readonly fieldErrors: Readonly<Partial<Record<UserField, string>>>;
}

const NO_FIELD_ERRORS: UserManagementFailure['fieldErrors'] = {};

export function userManagementFailureFrom(error: unknown): UserManagementFailure {
  if (!(error instanceof HttpErrorResponse)) {
    return failure('unknown', 'Impossible d’effectuer cette action. Réessayez.');
  }

  const problem = problemDetailFrom(error.error);
  switch (problem?.code) {
    case 'USER_EMAIL_ALREADY_USED':
      return {
        kind: 'email-already-used',
        message: 'Cette adresse email est déjà attribuée à un compte.',
        fieldErrors: { email: 'Cette adresse email est déjà utilisée.' },
      };
    case 'USER_NOT_FOUND':
      return failure('not-found', 'Ce compte n’existe plus. La liste a été actualisée.');
    case 'LAST_ACTIVE_OWNER':
      return failure(
        'last-active-owner',
        'Le magasin doit toujours conserver au moins un propriétaire actif.'
      );
    case 'OWNER_PASSWORD_RESET_FORBIDDEN':
      return failure(
        'owner-password-reset-forbidden',
        'Le mot de passe d’un propriétaire ne peut pas être réinitialisé depuis cette interface.'
      );
    case 'INVALID_USER_DATA':
    case 'VALIDATION_FAILED':
      return validationFailure(problem);
  }

  if (error.status === 400) return validationFailure(problem);
  if (error.status === 401) return failure('unauthorized', 'Votre session a expiré.');
  if (error.status === 403) return failure('forbidden', 'Vous n’avez plus accès à cette administration.');
  if (error.status === 404) {
    return failure('not-found', 'Ce compte n’existe plus. La liste a été actualisée.');
  }
  return failure('unknown', 'Impossible d’effectuer cette action. Réessayez.');
}

function validationFailure(problem: ProblemDetail | null): UserManagementFailure {
  const fieldErrors: Partial<Record<UserField, string>> = {};
  for (const validationError of problem?.errors ?? []) {
    if (validationError.field === 'displayName' || validationError.field === 'email') {
      fieldErrors[validationError.field] = validationError.message;
    }
  }

  return {
    kind: 'validation',
    message: problem?.detail ?? 'Vérifiez les informations saisies.',
    fieldErrors,
  };
}

function problemDetailFrom(value: unknown): ProblemDetail | null {
  return value !== null && typeof value === 'object' ? (value as ProblemDetail) : null;
}

function failure(
  kind: UserManagementFailureKind,
  message: string
): UserManagementFailure {
  return { kind, message, fieldErrors: NO_FIELD_ERRORS };
}
