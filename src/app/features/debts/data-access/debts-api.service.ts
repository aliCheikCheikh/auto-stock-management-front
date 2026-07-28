import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OutstandingDebtResponse } from '../models/debt.model';

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
}
