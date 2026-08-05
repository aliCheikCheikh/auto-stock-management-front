import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { LoginPage } from './login-page';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let httpTesting: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => httpTesting.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ouvre le tableau de bord après la connexion du propriétaire', () => {
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);
    component.form.setValue({ email: 'owner@example.com', password: 'Secret123!' });

    component.onSubmit();
    httpTesting.expectOne('/api/v1/auth/login').flush({
      userId: 'owner-1',
      displayName: 'Propriétaire',
      email: 'owner@example.com',
      role: 'OWNER',
      passwordTemporary: false,
    });

    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  });

  it('conserve le catalogue comme accueil du vendeur', () => {
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);
    component.form.setValue({ email: 'seller@example.com', password: 'Secret123!' });

    component.onSubmit();
    httpTesting.expectOne('/api/v1/auth/login').flush({
      userId: 'seller-1',
      displayName: 'Vendeur',
      email: 'seller@example.com',
      role: 'SELLER',
      passwordTemporary: false,
    });

    expect(navigateSpy).toHaveBeenCalledWith(['/products']);
  });
});
