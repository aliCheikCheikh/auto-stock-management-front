import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Page } from '../../../core/api/page.model';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = '/api/v1';

  listProducts(): Observable<Page<Product>> {
    return this.http.get<Page<Product>>(`${this.apiBaseUrl}/products`);
  }
}
