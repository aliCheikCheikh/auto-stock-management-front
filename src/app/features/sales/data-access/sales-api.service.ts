import { HttpClient, HttpHeaders } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { CreateSaleRequest, SaleResponse } from "../models/sales.model";
import { Observable } from "rxjs";



@Injectable({
    providedIn: 'root'
})
export class SalesApiService {
    private readonly apiBaseUrl = '/api/v1';
    private readonly http = inject(HttpClient);

    sellProduct(request: CreateSaleRequest,
        idempotencyKey?: string): Observable<SaleResponse> {
        let headers = new HttpHeaders();

        if (idempotencyKey !== undefined) {
            headers = headers.set('Idempotency-Key', idempotencyKey);
        }

        return this.http.post<SaleResponse>(
            `${this.apiBaseUrl}/sales`,
            request,
            { headers }
        );

    }
}


