import { Component, inject, output, signal } from '@angular/core';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { ConfirmDialog } from '../../../../shared/ui/confirm-dialog/confirm-dialog';
import { CategoriesApiService } from '../../data-access/categories-api.service';
import { categoryFailureFrom } from '../../models/category-api-error';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-category-delete-dialog',
  imports: [ConfirmDialog],
  templateUrl: './category-delete-dialog.html',
})
export class CategoryDeleteDialog {
  private readonly categoriesApi = inject(CategoriesApiService);
  private readonly notifications = inject(NotificationService);

  readonly changed = output<void>();
  readonly category = signal<Category | null>(null);
  readonly errorMessage = signal('');
  readonly isSubmitting = signal(false);

  open(category: Category): void {
    this.errorMessage.set('');
    this.category.set(category);
  }

  cancel(): void {
    if (!this.isSubmitting()) this.category.set(null);
  }

  confirm(): void {
    const category = this.category();
    if (!category || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.categoriesApi.deleteCategory(category.id).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.category.set(null);
        this.notifications.success('Famille de pièces supprimée.');
        this.changed.emit();
      },
      error: (error: unknown) => this.handleFailure(error),
    });
  }

  message(category: Category): string {
    return `Supprimez la famille de pièces « ${category.name} » uniquement si elle ne contient plus de produits.`;
  }

  private handleFailure(error: unknown): void {
    this.isSubmitting.set(false);
    const failure = categoryFailureFrom(error);
    if (failure.kind === 'in-use') {
      this.errorMessage.set(failure.message);
    } else if (failure.kind === 'not-found') {
      this.category.set(null);
      this.notifications.info('Cette famille n’existe plus. La liste a été actualisée.');
      this.changed.emit();
    } else {
      this.notifications.error(failure.message);
    }
  }
}
