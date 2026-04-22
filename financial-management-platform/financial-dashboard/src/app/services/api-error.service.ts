import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  private readonly _unavailable = signal(false);
  readonly unavailable = this._unavailable.asReadonly();

  setUnavailable(): void {
    this._unavailable.set(true);
  }

  clear(): void {
    this._unavailable.set(false);
  }
}
