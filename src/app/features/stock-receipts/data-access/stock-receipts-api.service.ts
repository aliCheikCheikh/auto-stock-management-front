import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  StockReceiptImportExecutionReport,
  StockReceiptImportPreview,
} from '../models/stock-receipt-import.model';
import { ReceiveStockRequest, StockReceiptAcknowledgement } from '../models/stock-receipt.model';

@Injectable({
    providedIn: 'root'
})
export class StockReceiptsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = '/api/v1';

  receiveStock(
    request: ReceiveStockRequest,
    idempotencyKey?: string,
  ): Observable<StockReceiptAcknowledgement> {
    let headers = new HttpHeaders();

    if (idempotencyKey !== undefined) {
      headers = headers.set('Idempotency-Key', idempotencyKey);
    }

    return this.http.post<StockReceiptAcknowledgement>(
      `${this.apiBaseUrl}/stock-receipts`,
      request,
      { headers },
    );
  }

  downloadImportTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiBaseUrl}/stock-receipts/import-template`, {
      responseType: 'blob',
    });
  }

  previewImport(file: File, shopId: string): Observable<StockReceiptImportPreview> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('shopId', shopId);

    return this.http.post<StockReceiptImportPreview>(
      `${this.apiBaseUrl}/stock-receipts/import-preview`,
      formData,
    );
  }

  executeImport(
    file: File,
    shopId: string,
    importId: string,
    selectedLineNumbers: ReadonlySet<number>,
  ): Observable<StockReceiptImportExecutionReport> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('shopId', shopId);
    formData.append('importId', importId);
    [...selectedLineNumbers]
      .sort((left, right) => left - right)
      .forEach((lineNumber) => formData.append('selectedLineNumbers', String(lineNumber)));

    return this.http.post<StockReceiptImportExecutionReport>(
      `${this.apiBaseUrl}/stock-receipts/import-executions`,
      formData,
    );
  }
}
