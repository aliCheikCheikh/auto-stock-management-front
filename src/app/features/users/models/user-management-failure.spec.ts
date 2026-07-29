import { HttpErrorResponse } from '@angular/common/http';
import { userManagementFailureFrom } from './user-management-failure';

describe('userManagementFailureFrom', () => {
  it('associe le conflit d’email au champ email', () => {
    const failure = userManagementFailureFrom(
      httpError(409, { code: 'USER_EMAIL_ALREADY_USED' })
    );

    expect(failure.kind).toBe('email-already-used');
    expect(failure.fieldErrors.email).toContain('déjà utilisée');
  });

  it('traduit la règle du dernier propriétaire actif sans dépendre du texte backend', () => {
    const failure = userManagementFailureFrom(
      httpError(409, { code: 'LAST_ACTIVE_OWNER', detail: 'backend wording' })
    );

    expect(failure.kind).toBe('last-active-owner');
    expect(failure.message).toBe(
      'Le magasin doit toujours conserver au moins un propriétaire actif.'
    );
  });

  it('conserve les erreurs de validation au voisinage des champs connus', () => {
    const failure = userManagementFailureFrom(
      httpError(400, {
        code: 'VALIDATION_FAILED',
        errors: [
          { field: 'displayName', message: 'Nom invalide.' },
          { field: 'email', message: 'Email invalide.' },
        ],
      })
    );

    expect(failure.fieldErrors).toEqual({
      displayName: 'Nom invalide.',
      email: 'Email invalide.',
    });
  });
});

function httpError(status: number, error: unknown): HttpErrorResponse {
  return new HttpErrorResponse({ status, error });
}
