import { Component, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { CategoriesApiService } from '../../data-access/categories-api.service';
import { categoryFailureFrom } from '../../models/category-api-error';
import {
  categoryNameError,
  createCategoryNameForm,
  validateCategoryNameForm,
} from '../../utils/category-name-form';

@Component({
  selector: 'app-category-create-form',
  imports: [ReactiveFormsModule],
  templateUrl: './category-create-form.html',
  styleUrl: './category-create-form.scss',
})
export class CategoryCreateForm {
  private readonly categoriesApi = inject(CategoriesApiService);
  private readonly notifications = inject(NotificationService);
  private readonly nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');

  readonly created = output<void>();
  readonly form = createCategoryNameForm();
  readonly serverError = signal('');
  readonly isSubmitting = signal(false);

  constructor() {
    this.form.controls.name.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.serverError.set(''));
  }

  submit(): void {
    if (this.isSubmitting() || !validateCategoryNameForm(this.form)) return;

    this.isSubmitting.set(true);
    this.categoriesApi.createCategory(this.form.getRawValue()).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.form.reset();
        this.notifications.success('Famille de pièces créée.');
        this.nameInput()?.nativeElement.focus();
        this.created.emit();
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        const failure = categoryFailureFrom(error);
        if (failure.kind === 'name-already-used' || failure.kind === 'validation') {
          this.serverError.set(failure.message);
        } else {
          this.notifications.error(failure.message);
        }
      },
    });
  }

  errorMessage(): string {
    return categoryNameError(this.form.controls.name, this.serverError());
  }
}
