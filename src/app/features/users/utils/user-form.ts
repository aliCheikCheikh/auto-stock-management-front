import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { UserManagementFailure } from '../models/user-management-failure';

const DISPLAY_NAME_MAX_LENGTH = 100;

export type CreateSellerForm = FormGroup<{
  displayName: FormControl<string>;
  email: FormControl<string>;
}>;

export type RenameUserForm = FormGroup<{
  displayName: FormControl<string>;
}>;

export function createSellerForm(): CreateSellerForm {
  return new FormGroup({
    displayName: new FormControl('', {
      nonNullable: true,
      validators: [nonBlank(), Validators.maxLength(DISPLAY_NAME_MAX_LENGTH)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [nonBlank(), Validators.email],
    }),
  });
}

export function createRenameUserForm(displayName: string): RenameUserForm {
  return new FormGroup({
    displayName: new FormControl(displayName, {
      nonNullable: true,
      validators: [nonBlank(), Validators.maxLength(DISPLAY_NAME_MAX_LENGTH)],
    }),
  });
}

export function validateUserForm(form: CreateSellerForm | RenameUserForm): boolean {
  if (form.valid) return true;
  form.markAllAsTouched();
  return false;
}

export function displayNameError(
  control: FormControl<string>,
  failure: UserManagementFailure | null
): string {
  const serverError = failure?.fieldErrors.displayName;
  if (serverError) return serverError;
  if (!control.touched) return '';
  if (control.hasError('blank')) return 'Saisissez un nom affiché.';
  if (control.hasError('maxlength')) return 'Limitez le nom à 100 caractères.';
  return '';
}

export function emailError(
  control: FormControl<string>,
  failure: UserManagementFailure | null
): string {
  const serverError = failure?.fieldErrors.email;
  if (serverError) return serverError;
  if (!control.touched) return '';
  if (control.hasError('blank')) return 'Saisissez une adresse email.';
  if (control.hasError('email')) return 'Saisissez une adresse email valide.';
  return '';
}

function nonBlank(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null =>
    typeof control.value === 'string' && control.value.trim().length > 0 ? null : { blank: true };
}
