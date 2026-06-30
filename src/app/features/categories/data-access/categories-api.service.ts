import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Category } from "../models/category.model";


@Injectable({
    providedIn: 'root'
})
export class CategoriesApiService{
    private readonly http = inject(HttpClient);
    private readonly apiBaseUrl = '/api/v1';

    listCategories():Observable<Category[]>{
        return this.http.get<Category[]>(`${this.apiBaseUrl}/categories`);
    }


}