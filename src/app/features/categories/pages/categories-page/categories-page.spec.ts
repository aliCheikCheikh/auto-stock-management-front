import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CategoriesPage } from './categories-page';
import { Category } from '../../models/category.model';
import {
  CATEGORY_IN_USE_MESSAGE,
  CATEGORY_NAME_ALREADY_USED_MESSAGE,
} from '../../models/category-api-error';
import { By } from '@angular/platform-browser';
import { CategoryCreateForm } from '../../ui/category-create-form/category-create-form';
import { CategoryDeleteDialog } from '../../ui/category-delete-dialog/category-delete-dialog';

const BRAKING: Category = { id: 'category-1', name: 'Freinage' };

describe('CategoriesPage', () => {
  let component: CategoriesPage;
  let fixture: ComponentFixture<CategoriesPage>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriesPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoriesPage);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpTesting.expectOne('/api/v1/categories').flush([BRAKING]);
    fixture.detectChanges();
  });

  afterEach(() => httpTesting.verify());

  function createForm(): CategoryCreateForm {
    return fixture.debugElement.query(By.directive(CategoryCreateForm)).componentInstance as CategoryCreateForm;
  }

  function deleteDialog(): CategoryDeleteDialog {
    return fixture.debugElement.query(By.directive(CategoryDeleteDialog)).componentInstance as CategoryDeleteDialog;
  }

  it('crée une famille, vide le champ, rend le focus et recharge la liste', () => {
    const create = createForm();
    const input = fixture.nativeElement.querySelector('#category-name') as HTMLInputElement;
    spyOn(input, 'focus').and.callThrough();
    create.form.controls.name.setValue('Électricité');

    create.submit();

    const createRequest = httpTesting.expectOne('/api/v1/categories');
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual({ name: 'Électricité' });
    createRequest.flush({ id: 'category-2', name: 'Électricité' });

    expect(create.form.controls.name.value).toBe('');
    expect(input.focus).toHaveBeenCalled();
    httpTesting.expectOne('/api/v1/categories').flush([
      BRAKING,
      { id: 'category-2', name: 'Électricité' },
    ]);
    expect(component.categories().length).toBe(2);
  });

  it('ignore un second envoi pendant la création', () => {
    const create = createForm();
    create.form.controls.name.setValue('Électricité');

    create.submit();
    create.submit();

    const requests = httpTesting.match('/api/v1/categories');
    expect(requests.length).toBe(1);
    requests[0].flush({ id: 'category-2', name: 'Électricité' });
    httpTesting.expectOne('/api/v1/categories').flush([BRAKING]);
  });

  it('renomme une famille en ligne puis recharge la liste', () => {
    component.startRename(BRAKING);
    component.renameForm.controls.name.setValue('Système de freinage');

    component.renameCategory();

    const renameRequest = httpTesting.expectOne('/api/v1/categories/category-1');
    expect(renameRequest.request.method).toBe('PUT');
    expect(renameRequest.request.body).toEqual({ name: 'Système de freinage' });
    renameRequest.flush({ id: 'category-1', name: 'Système de freinage' });
    httpTesting
      .expectOne('/api/v1/categories')
      .flush([{ id: 'category-1', name: 'Système de freinage' }]);

    expect(component.editingCategory()).toBeNull();
    expect(component.categories()[0].name).toBe('Système de freinage');
  });

  it('supprime une famille confirmée puis recharge la liste', () => {
    const dialog = deleteDialog();
    dialog.open(BRAKING);
    dialog.confirm();

    const deleteRequest = httpTesting.expectOne('/api/v1/categories/category-1');
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);
    httpTesting.expectOne('/api/v1/categories').flush([]);

    expect(dialog.category()).toBeNull();
    expect(component.categories()).toEqual([]);
  });

  it('affiche le refus de nom déjà utilisé à côté du champ de création', () => {
    const create = createForm();
    create.form.controls.name.setValue('freinage');
    create.submit();

    httpTesting.expectOne('/api/v1/categories').flush(
      { code: 'CATEGORY_NAME_ALREADY_USED' },
      { status: 409, statusText: 'Conflict' }
    );

    expect(create.serverError()).toBe(CATEGORY_NAME_ALREADY_USED_MESSAGE);
  });

  it('affiche le refus de nom déjà utilisé dans l’édition en ligne', () => {
    component.startRename(BRAKING);
    component.renameForm.controls.name.setValue('MOTEUR');
    component.renameCategory();

    httpTesting.expectOne('/api/v1/categories/category-1').flush(
      { code: 'CATEGORY_NAME_ALREADY_USED' },
      { status: 409, statusText: 'Conflict' }
    );

    expect(component.editingCategory()).toBe(BRAKING);
    expect(component.renameServerError()).toBe(CATEGORY_NAME_ALREADY_USED_MESSAGE);
  });

  it('ferme l’édition et recharge la liste si la famille a disparu', () => {
    component.startRename(BRAKING);
    component.renameForm.controls.name.setValue('Freins');
    component.renameCategory();

    httpTesting.expectOne('/api/v1/categories/category-1').flush(
      { code: 'CATEGORY_NOT_FOUND' },
      { status: 404, statusText: 'Not Found' }
    );
    httpTesting.expectOne('/api/v1/categories').flush([]);

    expect(component.editingCategory()).toBeNull();
    expect(component.categories()).toEqual([]);
  });

  it('garde le dialogue ouvert et y explique pourquoi la famille est utilisée', () => {
    const dialog = deleteDialog();
    dialog.open(BRAKING);
    fixture.detectChanges();
    dialog.confirm();

    httpTesting.expectOne('/api/v1/categories/category-1').flush(
      { code: 'CATEGORY_IN_USE' },
      { status: 409, statusText: 'Conflict' }
    );
    fixture.detectChanges();

    const dialogError = fixture.nativeElement.querySelector('.dialog-error') as HTMLElement;
    expect(dialog.category()).toBe(BRAKING);
    expect(dialog.errorMessage()).toBe(CATEGORY_IN_USE_MESSAGE);
    expect(dialogError.textContent?.trim()).toBe(CATEGORY_IN_USE_MESSAGE);
  });

  it('affiche le message de validation du serveur à côté du champ', () => {
    const create = createForm();
    create.form.controls.name.setValue('Nom refusé');
    create.submit();

    httpTesting.expectOne('/api/v1/categories').flush(
      {
        code: 'VALIDATION_FAILED',
        errors: [{ field: 'name', message: 'Le nom fourni est invalide.' }],
      },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(create.serverError()).toBe('Le nom fourni est invalide.');
  });
});
