import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  Injector,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { Spinner } from '../../../../shared/ui/spinner/spinner';
import { CategoriesApiService } from '../../data-access/categories-api.service';
import { categoryFailureFrom } from '../../models/category-api-error';
import { Category } from '../../models/category.model';
import { CategoryCreateForm } from '../../ui/category-create-form/category-create-form';
import { CategoryDeleteDialog } from '../../ui/category-delete-dialog/category-delete-dialog';
import {
  categoryNameError,
  createCategoryNameForm,
  validateCategoryNameForm,
} from '../../utils/category-name-form';

type CategoriesState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-categories-page',
  imports: [ReactiveFormsModule, CategoryCreateForm, CategoryDeleteDialog, EmptyState, Spinner],
  templateUrl: './categories-page.html',
  styleUrl: './categories-page.scss',
})
export class CategoriesPage implements OnInit {
  private readonly categoriesApi = inject(CategoriesApiService);
  private readonly notifications = inject(NotificationService);
  private readonly injector = inject(Injector);
  private readonly renameInput = viewChild<ElementRef<HTMLInputElement>>('renameInput');

  readonly state = signal<CategoriesState>('loading');
  readonly categories = signal<readonly Category[]>([]);
  readonly editingCategory = signal<Category | null>(null);
  readonly renameServerError = signal('');
  readonly isRenaming = signal(false);

  readonly renameForm = createCategoryNameForm();

  constructor() {
    this.renameForm.controls.name.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.renameServerError.set(''));
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.state.set('loading');
    this.categoriesApi.listCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.state.set('ready');
      },
      error: () => {
        this.state.set('error');
        this.notifications.error('Impossible de charger les familles de pièces.');
      },
    });
  }

  startRename(category: Category): void {
    this.editingCategory.set(category);
    this.renameServerError.set('');
    this.renameForm.reset({ name: category.name });
    afterNextRender(() => this.renameInput()?.nativeElement.select(), { injector: this.injector });
  }

  cancelRename(): void {
    if (!this.isRenaming()) this.editingCategory.set(null);
  }

  renameCategory(): void {
    const category = this.editingCategory();
    if (!category || this.isRenaming() || !validateCategoryNameForm(this.renameForm)) return;

    this.isRenaming.set(true);
    this.categoriesApi.renameCategory(category.id, this.renameForm.getRawValue()).subscribe({
      next: () => {
        this.isRenaming.set(false);
        this.editingCategory.set(null);
        this.notifications.success('Famille de pièces renommée.');
        this.loadCategories();
      },
      error: (error: unknown) => {
        this.isRenaming.set(false);
        this.handleRenameFailure(error);
      },
    });
  }

  renameErrorMessage(): string {
    return categoryNameError(this.renameForm.controls.name, this.renameServerError());
  }

  private handleRenameFailure(error: unknown): void {
    const failure = categoryFailureFrom(error);
    if (failure.kind === 'not-found') {
      this.handleMissingCategory();
    } else if (failure.kind === 'name-already-used' || failure.kind === 'validation') {
      this.renameServerError.set(failure.message);
    } else {
      this.notifications.error(failure.message);
    }
  }

  private handleMissingCategory(): void {
    this.editingCategory.set(null);
    this.notifications.info('Cette famille n’existe plus. La liste a été actualisée.');
    this.loadCategories();
  }
}
