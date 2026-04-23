import { Injectable, inject } from '@angular/core';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  private settings = inject(SettingsService);
  readonly isExpanded = this.settings.sidebarExpanded;

  toggle(): void {
    this.settings.setSidebarExpanded(!this.isExpanded());
  }

  collapse(): void {
    this.settings.setSidebarExpanded(false);
  }
}
