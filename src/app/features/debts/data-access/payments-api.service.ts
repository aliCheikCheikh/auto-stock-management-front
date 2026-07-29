import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaymentResponse, RecordPaymentRequest } from '../models/payment.model';

@Injectable({
    providedIn: 'root'
})
export class PaymentsApiService {
    private readonly http = inject(HttpClient);
    private readonly apiBaseUrl = '/api/v1';

    // Encaissement d'un remboursement : ouvert à tout utilisateur authentifié
    // (c'est le vendeur qui tient la caisse), contrairement à la liste des
    // créances réservée au propriétaire.
    recordPayment(saleId: string, request: RecordPaymentRequest): Observable<PaymentResponse> {
        return this.http.post<PaymentResponse>(
            `${this.apiBaseUrl}/sales/${saleId}/payments`,
            request
        );
    }
}
