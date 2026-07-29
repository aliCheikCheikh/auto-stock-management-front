import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordPaymentDialog } from './record-payment-dialog';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DebtPaymentTarget, PaymentResponse } from '../../models/payment.model';

const DEBT: DebtPaymentTarget = {
  saleId: 'sale-1',
  customerName: 'Ahmat Youssouf',
  totalAmount: { amount: '50000', currency: 'XAF' },
  amountPaid: { amount: '20000', currency: 'XAF' },
  amountDue: { amount: '30000', currency: 'XAF' },
};

const PAYMENT: PaymentResponse = {
  saleId: 'sale-1',
  amountPaid: { amount: '30000', currency: 'XAF' },
  receivedAt: '2026-07-29T09:00:00Z',
  totalAmount: { amount: '50000', currency: 'XAF' },
  totalCollected: { amount: '50000', currency: 'XAF' },
  amountDue: { amount: '0', currency: 'XAF' },
  settled: true,
};

function problem(status: number, code: string) {
  return { status, statusText: code };
}

describe('RecordPaymentDialog', () => {
  let component: RecordPaymentDialog;
  let fixture: ComponentFixture<RecordPaymentDialog>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecordPaymentDialog],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(RecordPaymentDialog);
    fixture.componentRef.setInput('debt', DEBT);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpTesting.verify());

  it('pré-remplit le montant avec le solde restant', () => {
    expect(component.amountControl.value).toBe('30000');
    expect(component.canSubmit()).toBeTrue();
    expect(component.remainingAfter()).toEqual({ amount: '0', currency: 'XAF' });
  });

  it('bloque la validation sur un montant vide ou nul', () => {
    component.amountControl.setValue('');
    expect(component.blockedReason()).toBe('Saisissez le montant reçu du client.');
    expect(component.canSubmit()).toBeFalse();

    component.amountControl.setValue('0');
    expect(component.canSubmit()).toBeFalse();
  });

  it('bloque la validation au-delà du solde restant', () => {
    component.amountControl.setValue('30001');
    expect(component.blockedReason()).toBe('Le montant dépasse le solde restant.');
    expect(component.canSubmit()).toBeFalse();
  });

  it('accepte un remboursement partiel et annonce le reste', () => {
    component.amountControl.setValue('12000');
    expect(component.canSubmit()).toBeTrue();
    expect(component.remainingAfter()).toEqual({ amount: '18000', currency: 'XAF' });
  });

  it('encaisse et émet la réponse du serveur', () => {
    const emitted: PaymentResponse[] = [];
    component.recorded.subscribe((payment) => emitted.push(payment));

    component.amountControl.setValue('12000');
    component.submit();

    const request = httpTesting.expectOne('/api/v1/sales/sale-1/payments');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ amount: 12000 });
    request.flush(PAYMENT);

    expect(emitted).toEqual([PAYMENT]);
    expect(component.isSubmitting()).toBeFalse();
  });

  it('ignore un second envoi tant que le premier est en cours', () => {
    component.submit();
    component.submit();

    httpTesting.expectOne('/api/v1/sales/sale-1/payments').flush(PAYMENT);
  });

  it('affiche le refus 409 dans le dialogue', () => {
    component.submit();

    httpTesting
      .expectOne('/api/v1/sales/sale-1/payments')
      .flush({ code: 'SALE_ALREADY_SETTLED' }, problem(409, 'Conflict'));

    expect(component.errorMessage()).toBe('Cette vente ne doit plus rien : la dette est déjà soldée.');
    expect(component.isSubmitting()).toBeFalse();
  });

  it('affiche le refus 422 dans le dialogue', () => {
    component.submit();

    httpTesting
      .expectOne('/api/v1/sales/sale-1/payments')
      .flush({ code: 'PAYMENT_EXCEEDS_AMOUNT_DUE' }, problem(422, 'Unprocessable Entity'));

    expect(component.errorMessage()).toBe('Le montant dépasse le solde restant de cette vente.');
  });

  it('remet le solde complet via le raccourci', () => {
    component.amountControl.setValue('5000');
    component.fillFullBalance();

    expect(component.amountControl.value).toBe('30000');
  });
});
