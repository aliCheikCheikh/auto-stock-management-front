import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AuthService } from './core/auth/auth.service';
import { AuthenticatedUser } from './core/auth/auth.model';

@Component({ template: '' })
class EmptyRoutePage {}

describe('App', () => {
  const currentUser = signal<AuthenticatedUser | null>(null);

  beforeEach(async () => {
    currentUser.set(null);
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([{ path: 'change-password', component: EmptyRoutePage }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            currentUser: currentUser.asReadonly(),
            logout: () => of(undefined),
          },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('cache la gestion des familles au vendeur et la montre au propriétaire', () => {
    const fixture = TestBed.createComponent(App);
    currentUser.set({
      userId: 'seller-1',
      displayName: 'Moussa Saleh',
      email: 'vendeur@autostock.test',
      role: 'SELLER',
      passwordTemporary: false,
    });
    fixture.detectChanges();

    expect(categoryLinks(fixture.nativeElement).length).toBe(0);
    expect(userManagementLinks(fixture.nativeElement).length).toBe(0);
    expect(dashboardLinks(fixture.nativeElement).length).toBe(0);

    currentUser.set({
      userId: 'owner-1',
      displayName: 'Ali Cheikh',
      email: 'patron@autostock.test',
      role: 'OWNER',
      passwordTemporary: false,
    });
    fixture.detectChanges();

    expect(categoryLinks(fixture.nativeElement).length).toBe(1);
    expect(userManagementLinks(fixture.nativeElement).length).toBe(1);
    expect(dashboardLinks(fixture.nativeElement).length).toBe(1);
  });

  it('retire toute la navigation métier de l’écran de changement obligatoire', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/change-password');
    fixture.detectChanges();

    expect(fixture.componentInstance.showChrome()).toBeFalse();
    expect(fixture.nativeElement.querySelector('.app-topbar')).toBeNull();
  });
});

function categoryLinks(root: HTMLElement): HTMLAnchorElement[] {
  return Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href="/admin/categories"]'));
}

function userManagementLinks(root: HTMLElement): HTMLAnchorElement[] {
  return Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href="/admin/users"]'));
}

function dashboardLinks(root: HTMLElement): HTMLAnchorElement[] {
  return Array.from(root.querySelectorAll<HTMLAnchorElement>('.app-nav a[href="/dashboard"]'));
}
