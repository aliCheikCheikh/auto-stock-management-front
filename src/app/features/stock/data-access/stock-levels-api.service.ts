import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Page } from '../../../core/api/page.model';
import { StockLevel } from '../models/stock-level.model';

@Injectable({
    providedIn: 'root',
})
export class StockLevelsApiService {
    private readonly http = inject(HttpClient);
    private readonly apiBaseUrl = '/api/v1';

    listStockLevels(): Observable<Page<StockLevel>> {
        return this.http.get<Page<StockLevel>>(`${this.apiBaseUrl}/stock-levels`);
    }
}