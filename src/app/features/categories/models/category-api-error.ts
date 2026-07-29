import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from '../../../core/api/problem-detail.model';

// L'unicité est insensible à la casse côté serveur : « freinage » entre en
// conflit avec « Freinage ». Le message le dit, sinon le refus passe pour un bug.
export const CATEGORY_NAME_ALREADY_USED_MESSAGE =
  'Une famille porte déjà ce nom. Les majuscules et minuscules ne les distinguent pas.';
export const CATEGORY_IN_USE_MESSAGE =
  'Cette famille contient encore des produits. Reclassez-les avant de la supprimer.';

export type CategoryFailureKind =
  | 'name-already-used'
  | 'in-use'
  | 'not-found'
  | 'validation'
  | 'unknown';

export interface CategoryFailure {
  readonly kind: CategoryFailureKind;
  readonly message: string;
}

export function categoryFailureFrom(error: unknown): CategoryFailure {
  if (!(error instanceof HttpErrorResponse)) {
    return unknownFailure();
  }

  const problem = problemDetailFrom(error.error);
  switch (problem?.code) {
    case 'CATEGORY_NAME_ALREADY_USED':
      return { kind: 'name-already-used', message: CATEGORY_NAME_ALREADY_USED_MESSAGE };
    case 'CATEGORY_IN_USE':
      return { kind: 'in-use', message: CATEGORY_IN_USE_MESSAGE };
    case 'CATEGORY_NOT_FOUND':
      return { kind: 'not-found', message: 'Cette famille n’existe plus.' };
  }

  if (error.status === 400) {
    const nameError = problem?.errors?.find((validationError) => validationError.field === 'name');
    return {
      kind: 'validation',
      message: nameError?.message ?? problem?.detail ?? 'Saisissez un nom valide.',
    };
  }

  if (error.status === 404) {
    return { kind: 'not-found', message: 'Cette famille n’existe plus.' };
  }
  return unknownFailure();
}

function problemDetailFrom(value: unknown): ProblemDetail | null {
  return value !== null && typeof value === 'object' ? (value as ProblemDetail) : null;
}

function unknownFailure(): CategoryFailure {
  return { kind: 'unknown', message: 'Impossible d’effectuer cette action.' };
}
