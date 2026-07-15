import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { CreateSaleRequest, SaleResponse } from "../models/sales.model";
import { Page } from "../../../core/api/page.model";
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class SalesApiService {
    private readonly apiBaseUrl = '/api/v1';
    private readonly http = inject(HttpClient);

    sellProduct(request: CreateSaleRequest, idempotencyKey?: string): Observable<SaleResponse> {
        let headers = new HttpHeaders();
        if (idempotencyKey !== undefined) {
            headers = headers.set('Idempotency-Key', idempotencyKey);
        }
        return this.http.post<SaleResponse>(`${this.apiBaseUrl}/sales`, request, { headers });
    }

    listSales(query: { page?: number; size?: number } = {}): Observable<Page<SaleResponse>> {
        let params = new HttpParams();
        if (query.page != null) params = params.set('page', query.page);
        if (query.size != null) params = params.set('size', query.size);
        return this.http.get<Page<SaleResponse>>(`${this.apiBaseUrl}/sales`, { params });
    }
}
