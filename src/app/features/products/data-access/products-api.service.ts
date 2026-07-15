import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Page } from "../../../core/api/page.model";
import { Product, ProductSearchResult, ProductStockSummary, UpdateProductRequest } from "../models/product.model";



@Injectable({
    providedIn: 'root'
})
export class ProductsApiService {
    private readonly http = inject(HttpClient);
    private readonly apiBaseUrl = '/api/v1';

    public listProducts(activeOnly = false): Observable<Page<Product>> {
        const params = new HttpParams().set('activeOnly', activeOnly);
        return this.http.get<Page<Product>>(`${this.apiBaseUrl}/products`, { params });
    }

    public getProductStockSummary(productId: string): Observable<ProductStockSummary> {
        return this.http
            .get<ProductStockSummary>
            (`${this.apiBaseUrl}/products/${productId}/stock-levels`);
    }

    public updateProduct(productId: string, request: UpdateProductRequest): Observable<Product> {
        return this.http.put<Product>(`${this.apiBaseUrl}/products/${productId}`, request);
    }

    public deactivateProduct(productId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiBaseUrl}/products/${productId}`);
    }

    public getProduct(productId: string): Observable<Product> {
        return this.http.get<Product>(`${this.apiBaseUrl}/products/${productId}`);
    }

    public searchProducts(query: string): Observable<ProductSearchResult[]> {
        const params = new HttpParams().set('q', query);
        return this.http.get<ProductSearchResult[]>(`${this.apiBaseUrl}/products/search`, { params });
    }



}
