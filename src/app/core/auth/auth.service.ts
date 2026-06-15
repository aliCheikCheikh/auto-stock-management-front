import { inject, Injectable, signal } from "@angular/core";
import { AuthenticatedUser, LoginRequest } from "./auth.model";
import { Observable, tap } from "rxjs";
import { HttpClient } from "@angular/common/http";


@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = '/api/v1';
    private readonly _currentUser = signal<AuthenticatedUser | null>(null);
    readonly currentUser = this._currentUser.asReadonly();

    login(credentials: LoginRequest): Observable<AuthenticatedUser> {
        return this.http.post<AuthenticatedUser>(`${this.apiUrl}/auth/login`,
            credentials
        ).pipe(
            tap((user) => this._currentUser.set(user))
        );
    }
}