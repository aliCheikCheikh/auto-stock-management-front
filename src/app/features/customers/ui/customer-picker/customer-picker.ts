import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, debounceTime, distinctUntilChanged, map, merge, of, Subject, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CustomersApiService } from '../../data-access/customers-api.service';
import { CreateCustomerRequest, CustomerResponse, customerDisplayName } from '../../models/customer.model';
import { ProblemDetail } from '../../../../core/api/problem-detail.model';
import { NotificationService } from '../../../../core/notifications/notification.service';

/**
 * Sélecteur de client, aligné sur `ProductPicker` : mêmes rôles ARIA
 * (`combobox` / `listbox` / `aria-activedescendant`), même navigation clavier
 * (↓ ↑ Entrée Échap), même pipeline `debounce + switchMap` — la recherche se
 * fait côté serveur (`GET /api/v1/customers?search=`).
 *
 * Deux ajouts propres au comptoir :
 *  - à l'ouverture (sans frappe), la déroulante montre les derniers clients ;
 *  - « + Nouveau client » est accessible en permanence, sans rien taper, et le
 *    texte déjà saisi pré-remplit le bon champ (lettres → nom, chiffres →
 *    téléphone). Le vendeur ne quitte jamais sa vente en cours.
 */
@Component({
  selector: 'app-customer-picker',
  imports: [ReactiveFormsModule],
  templateUrl: './customer-picker.html',
  styleUrl: './customer-picker.scss',
})
export class CustomerPicker {
  private readonly customersApi = inject(CustomersApiService);
  private readonly notificationService = inject(NotificationService);

  readonly inputId = input<string | null>(null);
  readonly placeholder = input('Nom ou numéro de téléphone…');
  readonly ariaLabel = input('Rechercher un client');

  readonly selected = output<CustomerResponse>();

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly firstCreateInput = viewChild<ElementRef<HTMLInputElement>>('firstCreateInput');

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly results = signal<CustomerResponse[]>([]);
  readonly searchState = signal<'idle' | 'loading' | 'error'>('idle');

  readonly focused = signal(false);
  readonly activeIndex = signal(-1);
  readonly creating = signal(false);
  readonly isSaving = signal(false);
  readonly createError = signal('');

  // Terme courant, suivi en parallèle du pipeline : distingue « aucun résultat »
  // de « liste des derniers clients ».
  private readonly query = signal('');

  // Rechargements déclenchés hors frappe (ouverture du menu, réessai).
  private readonly reload = new Subject<string>();

  readonly showDropdown = computed(() => this.focused() && !this.creating());
  readonly showEmpty = computed(() => this.searchState() === 'idle' && this.results().length === 0);
  readonly hasQuery = computed(() => this.query().length > 0);

  readonly createForm = new FormGroup({
    givenName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fatherName: new FormControl('', { nonNullable: true }),
    phoneNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
  });

  constructor() {
    merge(
      this.searchControl.valueChanges.pipe(
        debounceTime(250),
        map((value) => value.trim()),
        distinctUntilChanged()
      ),
      this.reload
    )
      .pipe(
        tap((term) => {
          this.query.set(term);
          this.searchState.set('loading');
        }),
        switchMap((term) =>
          this.customersApi.searchCustomers(term).pipe(
            catchError(() => {
              this.searchState.set('error');
              return of<CustomerResponse[]>([]);
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe((results) => {
        this.results.set(results);
        if (this.searchState() === 'loading') {
          this.searchState.set('idle');
        }
      });

    // Toute nouvelle liste réinitialise la sélection clavier.
    effect(() => {
      this.results();
      this.activeIndex.set(-1);
    });
  }

  displayName(customer: CustomerResponse): string {
    return customerDisplayName(customer.givenName, customer.fatherName);
  }

  onFocus(): void {
    this.focused.set(true);
    // Ouverture sans frappe : on montre les derniers clients enregistrés.
    if (this.results().length === 0 && this.searchState() !== 'loading') {
      this.reload.next(this.searchControl.value.trim());
    }
  }

  onBlur(): void {
    this.focused.set(false);
  }

  retrySearch(): void {
    this.reload.next(this.searchControl.value.trim());
  }

  onKeydown(event: KeyboardEvent): void {
    const items = this.results();

    if (event.key === 'Escape') {
      this.focused.set(false);
      return;
    }

    // Le champ vit dans le formulaire de vente : Entrée sélectionne un client,
    // elle ne déclenche jamais l'enregistrement de la vente.
    if (event.key === 'Enter') {
      event.preventDefault();
    }

    if (!this.showDropdown() || items.length === 0) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.update((i) => (i + 1) % items.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.update((i) => (i - 1 + items.length) % items.length);
        break;
      case 'Enter': {
        const index = this.activeIndex();
        if (index >= 0) {
          this.select(items[index]);
        }
        break;
      }
    }
  }

  select(customer: CustomerResponse): void {
    this.selected.emit(customer);
    this.searchControl.setValue(this.displayName(customer), { emitEvent: false });
    this.focused.set(false);
    this.creating.set(false);
  }

  /**
   * Ouvre le formulaire inline. Accessible sans avoir rien tapé ; si du texte
   * est déjà saisi, il pré-remplit le champ pertinent (chiffres → téléphone).
   */
  openCreateForm(): void {
    const term = this.searchControl.value.trim();
    const looksLikePhone = digitsOnly(term).length >= 3 && /^[\d\s+.\-()]+$/.test(term);
    this.createForm.reset({
      givenName: looksLikePhone ? '' : term,
      fatherName: '',
      phoneNumber: looksLikePhone ? term : '',
      email: '',
    });
    this.createError.set('');
    this.creating.set(true);
    this.focused.set(false);
    // Le vendeur enchaîne au clavier : le focus part sur le premier champ.
    queueMicrotask(() => this.firstCreateInput()?.nativeElement.focus());
  }

  cancelCreate(): void {
    this.creating.set(false);
    this.createError.set('');
    this.focus();
  }

  submitCreate(): void {
    if (this.isSaving()) {
      return;
    }

    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const value = this.createForm.getRawValue();
    const request: CreateCustomerRequest = {
      givenName: value.givenName.trim(),
      phoneNumber: value.phoneNumber.trim(),
      ...(value.fatherName.trim() ? { fatherName: value.fatherName.trim() } : {}),
      ...(value.email.trim() ? { email: value.email.trim() } : {}),
    };

    this.isSaving.set(true);
    this.createError.set('');

    this.customersApi.createCustomer(request).subscribe({
      next: (customer) => {
        this.isSaving.set(false);
        this.results.update((list) => [customer, ...list.filter((c) => c.customerId !== customer.customerId)]);
        this.notificationService.success('Client créé');
        this.select(customer);
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        const message = getCustomerErrorMessage(error);
        this.createError.set(message);
        this.notificationService.error(message);
      },
    });
  }

  // Réinitialise le champ (ex. après enregistrement de la vente).
  reset(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.query.set('');
    this.results.set([]);
    this.activeIndex.set(-1);
    this.focused.set(false);
    this.creating.set(false);
    this.createError.set('');
    this.createForm.reset({ givenName: '', fatherName: '', phoneNumber: '', email: '' });
  }

  focus(): void {
    this.searchInput()?.nativeElement.focus();
  }
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function getCustomerErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Une erreur inattendue est survenue.';
  }

  const problem = error.error as Partial<ProblemDetail> | null;

  switch (problem?.code) {
    case 'CUSTOMER_PHONE_ALREADY_USED':
      return 'Ce numéro de téléphone est déjà utilisé par un autre client.';
    case 'CUSTOMER_EMAIL_ALREADY_USED':
      return 'Cet email est déjà utilisé par un autre client.';
    case 'INVALID_PHONE_NUMBER':
      return 'Le numéro de téléphone est invalide.';
    case 'VALIDATION_FAILED':
      return 'Certaines informations du client sont invalides.';
    default:
      return 'Impossible de créer le client pour le moment.';
  }
}
