import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Page } from '../../../core/api/page.model';
import { OutstandingDebtResponse } from '../../debts/models/debt.model';
import { CreateCustomerRequest, CustomerResponse } from '../models/customer.model';

@Injectable({
    providedIn: 'root'
})
export class CustomersApiService {
    private readonly http = inject(HttpClient);
    private readonly apiBaseUrl = '/api/v1';

    /**
     * Recherche de clients côté serveur (`GET /api/v1/customers?search=`).
     * Sans terme, le backend renvoie les derniers clients enregistrés : c'est
     * ce qu'affiche la déroulante à l'ouverture, avant toute frappe.
     * La réponse est normalisée en tableau (liste brute ou page).
     */
    searchCustomers(search = ''): Observable<CustomerResponse[]> {
        const term = search.trim();
        const params = term ? new HttpParams().set('search', term) : new HttpParams();
        return this.http
            .get<CustomerResponse[] | Page<CustomerResponse>>(`${this.apiBaseUrl}/customers`, { params })
            .pipe(map((response) => (Array.isArray(response) ? response : [...(response?.content ?? [])])));
    }

    getCustomer(customerId: string): Observable<CustomerResponse> {
        return this.http.get<CustomerResponse>(`${this.apiBaseUrl}/customers/${customerId}`);
    }

    createCustomer(request: CreateCustomerRequest): Observable<CustomerResponse> {
        return this.http.post<CustomerResponse>(`${this.apiBaseUrl}/customers`, request);
    }

    getCustomerDebts(customerId: string): Observable<OutstandingDebtResponse[]> {
        return this.http.get<OutstandingDebtResponse[]>(
            `${this.apiBaseUrl}/customers/${customerId}/debts`
        );
    }
}
