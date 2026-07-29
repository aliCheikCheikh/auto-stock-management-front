import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  let fixture: ComponentFixture<ConfirmDialog>;
  let previouslyFocused: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ConfirmDialog] }).compileComponents();
    previouslyFocused = document.createElement('button');
    document.body.appendChild(previouslyFocused);
    previouslyFocused.focus();

    fixture = TestBed.createComponent(ConfirmDialog);
    fixture.componentRef.setInput('title', 'Supprimer ?');
    fixture.componentRef.setInput('message', 'Confirmez la suppression.');
    fixture.detectChanges();
  });

  afterEach(() => previouslyFocused.remove());

  it('affiche l’erreur dans le dialogue et bloque les actions pendant l’appel', () => {
    fixture.componentRef.setInput('errorMessage', 'Cette famille contient encore des produits.');
    fixture.componentRef.setInput('isSubmitting', true);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    expect(Array.from(buttons).every((button) => button.disabled)).toBeTrue();
  });

  it('piège la tabulation dans le dialogue', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    last.focus();

    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

    expect(document.activeElement).toBe(first);
  });

  it('ferme avec Échap et restitue le focus', () => {
    let cancelled = false;
    fixture.componentInstance.cancelled.subscribe(() => (cancelled = true));
    const backdrop = fixture.nativeElement.querySelector('.dialog-backdrop') as HTMLElement;

    backdrop.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(cancelled).toBeTrue();

    fixture.destroy();
    expect(document.activeElement).toBe(previouslyFocused);
  });
});
