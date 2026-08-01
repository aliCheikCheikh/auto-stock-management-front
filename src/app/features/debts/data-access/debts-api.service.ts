import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../../../core/api/page.model';
import { DebtQuery, DebtResponse } from '../models/debt.model';
import { CreditSaleDetailResponse } from '../models/credit-sale-detail.model';

export const DEBTS_PAGE_SIZE = 20;

@Injectable({
    providedIn: 'root'
})
export class DebtsApiService {
    private readonly http = inject(HttpClient);
    private readonly apiBaseUrl = '/api/v1';

    /**
     * Liste paginée des créances, réservée au propriétaire (403 sinon).
     * Aucun paramètre de tri n'est envoyé : l'ordre dépend du statut et
     * appartient au serveur.
     */
    listDebts(query: DebtQuery = {}): Observable<Page<DebtResponse>> {
        return this.http.get<Page<DebtResponse>>(`${this.apiBaseUrl}/debts`, {
            params: debtParams(query),
        });
    }

    // Détail d'une vente à crédit, également réservé au propriétaire. Reste
    // accessible après règlement complet : c'est la preuve du paiement.
    // 404 SALE_NOT_FOUND si la vente est au comptant — sans client, ce n'est
    // pas une créance.
    getDebt(saleId: string): Observable<CreditSaleDetailResponse> {
        return this.http.get<CreditSaleDetailResponse>(`${this.apiBaseUrl}/debts/${saleId}`);
    }
}

export function debtParams(query: DebtQuery): HttpParams {
    let params = new HttpParams()
        .set('status', query.status ?? 'OUTSTANDING')
        .set('page', query.page ?? 0)
        .set('size', query.size ?? DEBTS_PAGE_SIZE);

    if (query.customerId) {
        params = params.set('customerId', query.customerId);
    }
    return params;
}
