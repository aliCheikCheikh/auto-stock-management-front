import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ChangePasswordPage } from './change-password-page';

describe('ChangePasswordPage', () => {
  let fixture: ComponentFixture<ChangePasswordPage>;
  let component: ChangePasswordPage;
  let httpTesting: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangePasswordPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordPage);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => httpTesting.verify());

  it('recharge la session avant de restaurer l’accès normal', () => {
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);
    component.form.setValue({
      currentPassword: 'Temporaire1',
      newPassword: 'NouveauSecret1',
    });
    component.onSubmit();

    httpTesting.expectOne('/api/v1/auth/change-password').flush(null);
    httpTesting.expectOne('/api/v1/auth/me').flush({
      userId: 'seller-1',
      displayName: 'Amina Mahamat',
      email: 'amina@example.com',
      role: 'SELLER',
      passwordTemporary: false,
    });

    expect(navigateSpy).toHaveBeenCalledWith(['/products']);
    expect(component.isSubmitting()).toBeFalse();
  });

  it('affiche un mot de passe actuel incorrect près du champ concerné', () => {
    component.form.setValue({
      currentPassword: 'MauvaisSecret',
      newPassword: 'NouveauSecret1',
    });
    component.onSubmit();

    httpTesting.expectOne('/api/v1/auth/change-password').flush(
      { code: 'CURRENT_PASSWORD_INCORRECT' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(component.currentPasswordError()).toBe('Le mot de passe actuel est incorrect.');
    expect(component.submissionError()).toBe('');
  });
});
