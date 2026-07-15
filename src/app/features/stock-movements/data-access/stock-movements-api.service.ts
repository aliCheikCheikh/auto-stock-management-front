import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../../../core/api/page.model';
import { StockMovementResponse } from '../models/stock-movement.model';

@Injectable({ providedIn: 'root' })
export class StockMovementsApiService {
  private readonly apiBaseUrl = '/api/v1';
  private readonly http = inject(HttpClient);

  listStockMovements(query: { page?: number; size?: number } = {}): Observable<Page<StockMovementResponse>> {
    let params = new HttpParams();
    if (query.page != null) params = params.set('page', query.page);
    if (query.size != null) params = params.set('size', query.size);
    return this.http.get<Page<StockMovementResponse>>(`${this.apiBaseUrl}/stock-movements`, { params });
  }
}
