import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { CustomerPicker } from './customer-picker';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CustomerResponse } from '../../models/customer.model';

const RECENT: CustomerResponse[] = [
  {
    customerId: 'c-1',
    givenName: 'Ahmat',
    fatherName: 'Youssouf',
    phoneNumber: '+23566123456',
    email: null,
  },
];

describe('CustomerPicker', () => {
  let component: CustomerPicker;
  let fixture: ComponentFixture<CustomerPicker>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerPicker],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerPicker);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpTesting.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('affiche les derniers clients à l’ouverture, sans frappe', () => {
    component.onFocus();

    const request = httpTesting.expectOne((r) => r.url === '/api/v1/customers');
    expect(request.request.params.has('search')).toBeFalse();
    request.flush(RECENT);

    expect(component.results()).toEqual(RECENT);
    expect(component.hasQuery()).toBeFalse();
  });

  it('cherche côté serveur après le debounce', fakeAsync(() => {
    component.searchControl.setValue('ahm');
    tick(250);

    const request = httpTesting.expectOne((r) => r.url === '/api/v1/customers');
    expect(request.request.params.get('search')).toBe('ahm');
    request.flush(RECENT);

    expect(component.results()).toEqual(RECENT);
  }));

  it('crée un client sans recherche préalable et le sélectionne', () => {
    const selected: CustomerResponse[] = [];
    component.selected.subscribe((customer) => selected.push(customer));

    component.openCreateForm();
    component.createForm.controls.givenName.setValue('Idriss');
    component.createForm.controls.phoneNumber.setValue('66 00 11 22');
    component.submitCreate();

    const created: CustomerResponse = {
      customerId: 'c-3',
      givenName: 'Idriss',
      fatherName: null,
      phoneNumber: '+23566001122',
      email: null,
    };
    httpTesting.expectOne('/api/v1/customers').flush(created);

    expect(selected).toEqual([created]);
    expect(component.creating()).toBeFalse();
  });

  it('pré-remplit le téléphone quand la saisie est numérique', () => {
    component.searchControl.setValue('66 12 34 56');
    component.openCreateForm();

    expect(component.createForm.controls.phoneNumber.value).toBe('66 12 34 56');
    expect(component.createForm.controls.givenName.value).toBe('');
  });
});
