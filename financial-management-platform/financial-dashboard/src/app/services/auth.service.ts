import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _isLoggedIn = signal(this.getInitialLoginState());

  isLoggedIn = this._isLoggedIn.asReadonly();

  private getInitialLoginState(): boolean {
    return localStorage.getItem('loggedIn') === 'true';
  }

  login(): void {
    localStorage.setItem('loggedIn', 'true');
    this._isLoggedIn.set(true);
  }

  logout(): void {
    localStorage.removeItem('loggedIn');
    this._isLoggedIn.set(false);
  }
}
