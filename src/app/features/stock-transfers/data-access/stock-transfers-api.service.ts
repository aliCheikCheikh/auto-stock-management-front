import { HttpClient, HttpHeaders } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { StockTransferAcknowledgement, TransferStockRequest } from "../models/stock-transfers.model";
import { Observable } from "rxjs";


@Injectable({
    providedIn: 'root'
})
export class StockTransfersApiService {
    private readonly apiBaseUrl = '/api/v1';
    private readonly http = inject(HttpClient);


    transferStock(request: TransferStockRequest, idempotencyKey?: string): Observable<StockTransferAcknowledgement> {
        let headers = new HttpHeaders();
        if (idempotencyKey !== undefined) {
            headers = headers.set('Idempotency-Key', idempotencyKey);
        }

        return this.http.post<StockTransferAcknowledgement>(
            `${this.apiBaseUrl}/stock-transfers`,
            request,
            { headers }
        );

    }
}