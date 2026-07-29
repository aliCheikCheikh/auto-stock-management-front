import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UsersApiService } from './users-api.service';

describe('UsersApiService', () => {
  let service: UsersApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsersApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('respecte le contrat de création sans envoyer de mot de passe choisi par le front', () => {
    service.createSeller({ displayName: 'Amina Mahamat', email: 'amina@example.com' }).subscribe();

    const request = httpTesting.expectOne('/api/v1/users');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      displayName: 'Amina Mahamat',
      email: 'amina@example.com',
    });
    request.flush({
      user: {
        userId: 'seller-1',
        displayName: 'Amina Mahamat',
        email: 'amina@example.com',
        role: 'SELLER',
        passwordChangeRequired: true,
        active: true,
      },
      temporaryPassword: 'SecretTemporaire',
    });
  });

  it('expose séparément le renommage, la réactivation et la réinitialisation', () => {
    service.renameUser('user-1', { displayName: 'Nouveau nom' }).subscribe();
    const renameRequest = httpTesting.expectOne('/api/v1/users/user-1/display-name');
    expect(renameRequest.request.method).toBe('PATCH');
    expect(renameRequest.request.body).toEqual({ displayName: 'Nouveau nom' });
    renameRequest.flush({});

    service.reactivateUser('user-1').subscribe();
    const reactivateRequest = httpTesting.expectOne('/api/v1/users/user-1/reactivate');
    expect(reactivateRequest.request.method).toBe('POST');
    expect(reactivateRequest.request.body).toBeNull();
    reactivateRequest.flush({});

    service.resetPassword('user-1').subscribe();
    const resetRequest = httpTesting.expectOne('/api/v1/users/user-1/reset-password');
    expect(resetRequest.request.method).toBe('POST');
    expect(resetRequest.request.body).toBeNull();
    resetRequest.flush({ temporaryPassword: 'SecretTemporaire' });
  });
});
