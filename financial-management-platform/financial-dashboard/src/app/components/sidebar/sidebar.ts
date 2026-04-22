import { DOCUMENT } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { NgIf } from '@angular/common';
import { SidebarService } from '../../services/sidebar.service';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';
import { FinanceService } from '../../services/finance.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, NgIf],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private router = inject(Router);
  private document = inject(DOCUMENT);
  readonly sidebar = inject(SidebarService);
  private auth = inject(AuthService);
  private settings = inject(SettingsService);
  private financeService = inject(FinanceService);
  readonly isExpanded = this.sidebar.isExpanded;
  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly isDarkTheme = computed(() => this.settings.theme() === 'dark');

  constructor() {
    this.applyThemeToDocument(this.settings.theme());
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && window.innerWidth < 1024) {
        this.sidebar.collapse();
      }
    });
  }

  toggleTheme(): void {
    const next = this.isDarkTheme() ? 'light' : 'dark';
    this.settings.setTheme(next);
    this.applyThemeToDocument(next);
  }

  private applyThemeToDocument(theme: 'light' | 'dark'): void {
    this.document.documentElement.setAttribute('data-theme', theme);
  }

  logout(): void {
    this.auth.logout();
    this.financeService.clearStore();
    this.router.navigate(['/login']);
  }
}
