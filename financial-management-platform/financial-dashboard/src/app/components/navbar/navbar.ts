import { DOCUMENT } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIf } from '@angular/common';
import { FinanceService } from '../../services/finance.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, NgIf],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private document = inject(DOCUMENT);
  private finance = inject(FinanceService);
  private router = inject(Router);
  readonly isDarkTheme = signal(false);
  readonly selectedMonth = this.finance.selectedMonth;
  readonly selectedYear = this.finance.selectedYear;
  readonly isLoggedIn = computed(() => localStorage.getItem('loggedIn') === 'true');
  readonly isLoginOrRegister = computed(() => {
    const url = this.router.url;
    return url === '/login' || url === '/register';
  });

  private readonly monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  constructor() {
    this.applyInitialTheme();
  }

  monthLabel(): string {
    return `${this.monthNames[this.selectedMonth()]} ${this.selectedYear()}`;
  }

  prevMonth(): void {
    if (this.selectedMonth() === 0) {
      this.finance.setSelectedMonth(11);
      this.finance.setSelectedYear(this.selectedYear() - 1);
    } else {
      this.finance.setSelectedMonth(this.selectedMonth() - 1);
    }
  }

  nextMonth(): void {
    if (this.selectedMonth() === 11) {
      this.finance.setSelectedMonth(0);
      this.finance.setSelectedYear(this.selectedYear() + 1);
    } else {
      this.finance.setSelectedMonth(this.selectedMonth() + 1);
    }
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
