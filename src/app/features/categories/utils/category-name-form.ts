import { FormControl, FormGroup, Validators } from '@angular/forms';

export type CategoryNameForm = FormGroup<{ name: FormControl<string> }>;

export function createCategoryNameForm(): CategoryNameForm {
  return new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(255)],
    }),
  });
}

export function validateCategoryNameForm(form: CategoryNameForm): boolean {
  if (form.valid) return true;
  form.markAllAsTouched();
  return false;
}

export function categoryNameError(control: FormControl<string>, serverError: string): string {
  if (serverError) return serverError;
  if (!control.touched) return '';
  if (control.hasError('required')) return 'Saisissez un nom.';
  if (control.hasError('maxlength')) return 'Limitez le nom à 255 caractères.';
  return '';
}
