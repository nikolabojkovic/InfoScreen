import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

const JWT_KEY = 'jwt_token';
const LOGGED_IN_KEY = 'loggedIn';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly _isLoggedIn = signal(this.getInitialLoginState());

  isLoggedIn = this._isLoggedIn.asReadonly();

  private getInitialLoginState(): boolean {
    return !!localStorage.getItem(JWT_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(JWT_KEY);
  }

  login(username: string, password: string): Observable<{ token: string }> {
    return this.http
      .post<{ token: string }>(`${environment.apiUrl}/api/auth/login`, { username, password })
      .pipe(
        tap(res => {
          localStorage.setItem(JWT_KEY, res.token);
          this._isLoggedIn.set(true);
        })
      );
  }

  register(username: string, password: string, fullName: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/api/auth/register`, {
      username,
      password,
      fullName,
    });
  }

  logout(): void {
    localStorage.removeItem(JWT_KEY);
    localStorage.removeItem(LOGGED_IN_KEY);
    this._isLoggedIn.set(false);
  }

  /** Returns the username from the stored JWT, or 'guest' if not logged in / token invalid. */
  getUsername(): string {
    try {
      const token = localStorage.getItem(JWT_KEY);
      if (!token) return 'guest';
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '==='.slice((base64.length + 3) % 4);
      const payload = JSON.parse(atob(padded)) as Record<string, unknown>;
      return typeof payload['sub'] === 'string' && payload['sub'] ? payload['sub'] : 'guest';
    } catch {
      return 'guest';
    }
  }
}

