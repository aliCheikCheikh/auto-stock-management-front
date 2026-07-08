import { inject, Injectable, signal } from "@angular/core";
import { AuthenticatedUser, ChangePasswordRequest, LoginRequest } from "./auth.model";
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
    me(): Observable<AuthenticatedUser> {
        return this.http.get<AuthenticatedUser>(`${this.apiUrl}/auth/me`).pipe(
            tap((user) => this._currentUser.set(user))
        );
    }

    changePassword(request: ChangePasswordRequest): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/auth/change-password`, request).pipe(
            tap(() => {
                const user = this._currentUser();
                if (user) {
                    // Le mot de passe n'est plus temporaire : la garde laissera passer.
                    this._currentUser.set({ ...user, passwordTemporary: false });
                }
            })
        );
    }

    logout(): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/auth/logout`, {}).pipe(
            tap(() => this._currentUser.set(null))
        )
    }

    refresh(): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/auth/refresh`, {});
    }

    clearSession(): void {
        this._currentUser.set(null);
    }
}