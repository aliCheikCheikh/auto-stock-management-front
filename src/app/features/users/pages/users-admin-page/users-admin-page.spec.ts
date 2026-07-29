import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthenticatedUser } from '../../../../core/auth/auth.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { CreateSellerDialog } from '../../ui/create-seller-dialog/create-seller-dialog';
import { RenameUserDialog } from '../../ui/rename-user-dialog/rename-user-dialog';
import { User } from '../../models/user.model';
import { UsersAdminPage } from './users-admin-page';

const OWNER: User = {
  userId: 'owner-1',
  displayName: 'Ali Cheikh',
  email: 'ali@example.com',
  role: 'OWNER',
  passwordChangeRequired: false,
  active: true,
};

const INACTIVE_SELLER: User = {
  userId: 'seller-1',
  displayName: 'Amina Mahamat',
  email: 'amina@example.com',
  role: 'SELLER',
  passwordChangeRequired: true,
  active: false,
};

const authenticatedOwner: AuthenticatedUser = {
  userId: OWNER.userId,
  displayName: OWNER.displayName,
  email: OWNER.email,
  role: OWNER.role,
  passwordTemporary: false,
};

describe('UsersAdminPage', () => {
  let fixture: ComponentFixture<UsersAdminPage>;
  let component: UsersAdminPage;
  let httpTesting: HttpTestingController;
  const currentUser = signal<AuthenticatedUser | null>(authenticatedOwner);

  beforeEach(async () => {
    currentUser.set(authenticatedOwner);
    await TestBed.configureTestingModule({
      imports: [UsersAdminPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            currentUser: currentUser.asReadonly(),
            clearSession: () => currentUser.set(null),
            me: () => of(authenticatedOwner),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersAdminPage);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpTesting.expectOne('/api/v1/users').flush([OWNER, INACTIVE_SELLER]);
    fixture.detectChanges();
  });

  afterEach(() => httpTesting.verify());

  it('affiche les compteurs et recherche localement par nom ou email', () => {
    expect(component.store.totalCount()).toBe(2);
    expect(component.store.activeCount()).toBe(1);
    expect(component.store.inactiveCount()).toBe(1);

    component.searchTerm.set('amina@');
    expect(component.filteredUsers()).toEqual([INACTIVE_SELLER]);
  });

  it('crée un vendeur, affiche le secret une fois puis l’efface à la fermeture', () => {
    component.openCreateDialog();
    fixture.detectChanges();
    const dialog = createDialog();
    dialog.form.setValue({ displayName: 'Moussa Saleh', email: 'moussa@example.com' });
    dialog.submit();

    const request = httpTesting.expectOne('/api/v1/users');
    expect(request.request.body).toEqual({
      displayName: 'Moussa Saleh',
      email: 'moussa@example.com',
    });
    request.flush({
      user: {
        userId: 'seller-2',
        displayName: 'Moussa Saleh',
        email: 'moussa@example.com',
        role: 'SELLER',
        passwordChangeRequired: true,
        active: true,
      },
      temporaryPassword: 'SecretAffichéUneFois',
    });

    expect(component.oneTimePassword()?.value).toBe('SecretAffichéUneFois');
    expect(component.store.totalCount()).toBe(3);

    component.closeOneTimePassword();
    expect(component.oneTimePassword()).toBeNull();
  });

  it('conserve le formulaire et place un email dupliqué près du champ', () => {
    component.openCreateDialog();
    fixture.detectChanges();
    const dialog = createDialog();
    dialog.form.setValue({ displayName: 'Autre compte', email: OWNER.email });
    dialog.submit();

    httpTesting.expectOne('/api/v1/users').flush(
      { code: 'USER_EMAIL_ALREADY_USED' },
      { status: 409, statusText: 'Conflict' }
    );
    fixture.detectChanges();

    expect(component.createDialogOpen()).toBeTrue();
    expect(dialog.form.controls.email.value).toBe(OWNER.email);
    expect(dialog.emailError()).toContain('déjà utilisée');
  });

  it('renomme le compte sans modifier son email', () => {
    component.openRenameDialog(INACTIVE_SELLER);
    fixture.detectChanges();
    const dialog = renameDialog();
    dialog.form.controls.displayName.setValue('Amina Saleh');
    dialog.submit();

    const request = httpTesting.expectOne('/api/v1/users/seller-1/display-name');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ displayName: 'Amina Saleh' });
    request.flush({ ...INACTIVE_SELLER, displayName: 'Amina Saleh' });

    const renamedUser = component.store.users().find((user) => user.userId === 'seller-1');
    expect(renamedUser?.displayName).toBe('Amina Saleh');
    expect(renamedUser?.email).toBe(INACTIVE_SELLER.email);
  });

  it('garde la confirmation ouverte si le backend refuse le dernier propriétaire actif', () => {
    component.requestDeactivation(OWNER);
    component.confirmAction();

    httpTesting.expectOne('/api/v1/users/owner-1').flush(
      { code: 'LAST_ACTIVE_OWNER' },
      { status: 409, statusText: 'Conflict' }
    );

    expect(component.confirmation()?.user).toBe(OWNER);
    expect(component.confirmationFailure()?.message).toBe(
      'Le magasin doit toujours conserver au moins un propriétaire actif.'
    );
  });

  it('réactive un compte sans recharger toute la page', () => {
    component.reactivateUser(INACTIVE_SELLER);

    const request = httpTesting.expectOne('/api/v1/users/seller-1/reactivate');
    expect(request.request.method).toBe('POST');
    request.flush({ ...INACTIVE_SELLER, active: true });

    expect(component.store.users().find((user) => user.userId === 'seller-1')?.active).toBeTrue();
  });

  function createDialog(): CreateSellerDialog {
    return fixture.debugElement.query(By.directive(CreateSellerDialog)).componentInstance;
  }

  function renameDialog(): RenameUserDialog {
    return fixture.debugElement.query(By.directive(RenameUserDialog)).componentInstance;
  }
});
