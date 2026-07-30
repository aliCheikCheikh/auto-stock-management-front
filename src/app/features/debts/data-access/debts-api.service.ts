import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OutstandingDebtResponse } from '../models/debt.model';
import { CreditSaleDetailResponse } from '../models/credit-sale-detail.model';

@Injectable({
    providedIn: 'root'
})
export class DebtsApiService {
    private readonly http = inject(HttpClient);
    private readonly apiBaseUrl = '/api/v1';

    // Réservé au rôle OWNER côté backend (403 sinon). Trié du plus ancien au
    // plus récent : l'ordre reçu est conservé tel quel à l'affichage.
    listDebts(): Observable<OutstandingDebtResponse[]> {
        return this.http.get<OutstandingDebtResponse[]>(`${this.apiBaseUrl}/debts`);
    }

    // Détail d'une vente à crédit, également réservé au propriétaire.
    // 404 SALE_NOT_FOUND si la vente n'existe pas ou si elle a été réglée au
    // comptant : une vente sans client n'est pas une créance.
    getDebt(saleId: string): Observable<CreditSaleDetailResponse> {
        return this.http.get<CreditSaleDetailResponse>(`${this.apiBaseUrl}/debts/${saleId}`);
    }
}
