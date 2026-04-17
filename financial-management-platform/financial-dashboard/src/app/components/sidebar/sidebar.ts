import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { NgIf } from '@angular/common';
import { SidebarService } from '../../services/sidebar.service';

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
  readonly isExpanded = this.sidebar.isExpanded;
  readonly isLoggedIn = computed(() => localStorage.getItem('loggedIn') === 'true');
  readonly isDarkTheme = signal(false);

  constructor() {
    this.applyInitialTheme();
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && window.innerWidth < 768) {
        this.sidebar.collapse();
      }
    });
  }

  toggleTheme(): void {
    this.setTheme(this.isDarkTheme() ? 'light' : 'dark');
  }

  private applyInitialTheme(): void {
    if (typeof window === 'undefined') {
      this.setTheme('light', false);
      return;
    }
    const savedTheme = window.localStorage.getItem('finance-dashboard-theme');
    const theme = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'light';
    this.setTheme(theme, false);
  }

  private setTheme(theme: 'light' | 'dark', persist = true): void {
    this.document.documentElement.setAttribute('data-theme', theme);
    this.isDarkTheme.set(theme === 'dark');
    if (persist && typeof window !== 'undefined') {
      window.localStorage.setItem('finance-dashboard-theme', theme);
    }
  }
}
