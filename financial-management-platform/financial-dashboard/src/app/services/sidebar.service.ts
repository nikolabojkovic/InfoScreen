import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  readonly isExpanded = signal(typeof window !== 'undefined' && window.innerWidth >= 768);

  toggle(): void {
    this.isExpanded.update(v => !v);
  }

  collapse(): void {
    this.isExpanded.set(false);
  }
}
