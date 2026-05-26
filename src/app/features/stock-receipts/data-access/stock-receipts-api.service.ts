import { HttpClient, HttpHeaders } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { ReceiveStockRequest, StockReceiptAcknowledgement } from "../models/stock-receipt.model";
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class StockReceiptsApiService {
    private readonly http = inject(HttpClient);
    private readonly apiBaseUrl = '/api/v1';

    receiveStock(
        request: ReceiveStockRequest,
        idempotencyKey?: string
    ): Observable<StockReceiptAcknowledgement> {
        let headers = new HttpHeaders();

        if (idempotencyKey !== undefined) {
            headers = headers.set('Idempotency-Key', idempotencyKey);
        }

        return this.http.post<StockReceiptAcknowledgement>(
            `${this.apiBaseUrl}/stock-receipts`,
            request,
            { headers }
        );
    }

}