import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateUserRequest, ResetPasswordRequest, User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/users';

  listUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  createSeller(request: CreateUserRequest): Observable<User> {
    return this.http.post<User>(this.apiUrl, request);
  }

  deactivateUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}`);
  }

  resetPassword(userId: string, request: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${userId}/reset-password`, request);
  }
}
