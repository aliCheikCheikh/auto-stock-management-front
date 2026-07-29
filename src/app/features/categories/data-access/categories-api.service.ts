import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Category, CategoryNameRequest } from '../models/category.model';

@Injectable({
  providedIn: 'root',
})
export class CategoriesApiService {
  private readonly http = inject(HttpClient);
  private readonly categoriesUrl = '/api/v1/categories';

  listCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.categoriesUrl);
  }

  createCategory(request: CategoryNameRequest): Observable<Category> {
    return this.http.post<Category>(this.categoriesUrl, request);
  }

  renameCategory(categoryId: string, request: CategoryNameRequest): Observable<Category> {
    return this.http.put<Category>(`${this.categoriesUrl}/${categoryId}`, request);
  }

  deleteCategory(categoryId: string): Observable<void> {
    return this.http.delete<void>(`${this.categoriesUrl}/${categoryId}`);
  }
}
