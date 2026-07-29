import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreatedUserResponse,
  CreateUserRequest,
  RenameUserRequest,
  TemporaryPasswordResponse,
  User,
} from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/users';

  listUsers(): Observable<readonly User[]> {
    return this.http.get<readonly User[]>(this.apiUrl);
  }

  createSeller(request: CreateUserRequest): Observable<CreatedUserResponse> {
    return this.http.post<CreatedUserResponse>(this.apiUrl, request);
  }

  renameUser(userId: string, request: RenameUserRequest): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${userId}/display-name`, request);
  }

  deactivateUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}`);
  }

  reactivateUser(userId: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/${userId}/reactivate`, null);
  }

  resetPassword(userId: string): Observable<TemporaryPasswordResponse> {
    return this.http.post<TemporaryPasswordResponse>(`${this.apiUrl}/${userId}/reset-password`, null);
  }
}
