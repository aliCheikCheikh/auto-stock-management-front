import { ComponentFixture, TestBed } from '@angular/core/testing';
import { User } from '../../models/user.model';
import { UsersList } from './users-list';

const OWNER: User = {
  userId: 'owner-1',
  displayName: 'Ali Cheikh',
  email: 'ali@example.com',
  role: 'OWNER',
  passwordChangeRequired: false,
  active: true,
};

const SELLER: User = {
  userId: 'seller-1',
  displayName: 'Amina Mahamat',
  email: 'amina@example.com',
  role: 'SELLER',
  passwordChangeRequired: true,
  active: true,
};

describe('UsersList', () => {
  let fixture: ComponentFixture<UsersList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [UsersList] }).compileComponents();
    fixture = TestBed.createComponent(UsersList);
    fixture.componentRef.setInput('users', [OWNER, SELLER]);
    fixture.componentRef.setInput('currentUserId', OWNER.userId);
    fixture.componentRef.setInput('activeOwnerCount', 1);
    fixture.componentRef.setInput('pendingActionKeys', new Set());
    fixture.detectChanges();
  });

  it('distingue le rôle, l’état, le compte courant et le changement attendu', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Propriétaire');
    expect(text).toContain('Vendeur');
    expect(text).toContain('Actif');
    expect(text).toContain('Vous');
    expect(text).toContain('Changement de mot de passe en attente');
  });

  it('ne propose jamais la réinitialisation du mot de passe au propriétaire', () => {
    const rows = Array.from(
      fixture.nativeElement.querySelectorAll('tbody tr') as NodeListOf<HTMLTableRowElement>
    );
    const ownerRow = rows.find((row) => row.textContent?.includes(OWNER.email));
    const sellerRow = rows.find((row) => row.textContent?.includes(SELLER.email));

    expect(ownerRow?.textContent).not.toContain('Réinitialiser le mot de passe');
    expect(sellerRow?.textContent).toContain('Réinitialiser le mot de passe');
  });

  it('désactive visuellement la désactivation de l’unique propriétaire actif', () => {
    const ownerRow = Array.from(
      fixture.nativeElement.querySelectorAll('tbody tr') as NodeListOf<HTMLTableRowElement>
    ).find((row) => row.textContent?.includes(OWNER.email));
    const deactivateButton = Array.from(ownerRow!.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Désactiver'
    );

    expect(deactivateButton?.disabled).toBeTrue();
  });
});
