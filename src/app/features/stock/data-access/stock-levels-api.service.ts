import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Page } from '../../../core/api/page.model';
import { StockLevel } from '../models/stock-level.model';

export interface StockLevelsQuery {
    readonly page?: number;
    readonly size?: number;
    readonly productId?: string;
    readonly belowThreshold?: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class StockLevelsApiService {
    private readonly http = inject(HttpClient);
    private readonly apiBaseUrl = '/api/v1';

    listStockLevels(query: StockLevelsQuery = {}): Observable<Page<StockLevel>> {
        let params = new HttpParams();
        if (query.page !== undefined) {
            params = params.set('page', query.page);
        }
        if (query.size !== undefined) {
            params = params.set('size', query.size);
        }
        if (query.productId !== undefined) {
            params = params.set('productId', query.productId);
        }
        if (query.belowThreshold !== undefined) {
            params = params.set('belowThreshold', query.belowThreshold);
        }

        return this.http.get<Page<StockLevel>>(`${this.apiBaseUrl}/stock-levels`,
            { params });
    }
}