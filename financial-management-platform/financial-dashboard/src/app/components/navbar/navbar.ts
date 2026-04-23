import { DOCUMENT } from '@angular/common';
import { Component, inject, computed, signal, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIf } from '@angular/common';
import { FinanceService } from '../../services/finance.service';
import { SidebarService } from '../../services/sidebar.service';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';

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
  private settings = inject(SettingsService);
  readonly sidebar = inject(SidebarService);
  readonly isDarkTheme = computed(() => this.settings.theme() === 'dark');
  readonly selectedMonth = this.finance.selectedMonth;
  readonly selectedYear = this.finance.selectedYear;
  private auth = inject(AuthService);
  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly isLoginOrRegister = computed(() => {
    const url = this.router.url;
    return url === '/login' || url === '/register';
  });

  @ViewChild('monthPicker') monthPickerRef!: ElementRef<HTMLInputElement>;

  private readonly monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  constructor() {
    this.document.documentElement.setAttribute('data-theme', this.settings.theme());
  }

  monthLabel(): string {
    return `${this.monthNames[this.selectedMonth()]} ${this.selectedYear()}`;
  }

  /** Value for the hidden input: yyyy-MM */
  get monthPickerValue(): string {
    const y = this.selectedYear();
    const m = String(this.selectedMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  openPicker(): void {
    const el = this.monthPickerRef?.nativeElement;
    if (el) {
      el.value = this.monthPickerValue;
      el.showPicker?.();
      el.focus();
    }
  }

  onPickerChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value; // yyyy-MM
    if (!value) return;
    const [y, m] = value.split('-').map(Number);
    this.finance.setMonthYear(m - 1, y);
  }

  prevMonth(): void {
    if (this.selectedMonth() === 0) {
      this.finance.setSelectedYear(this.selectedYear() - 1);
      this.finance.setSelectedMonth(11);
    } else {
      this.finance.setSelectedMonth(this.selectedMonth() - 1);
    }
  }

  nextMonth(): void {
    if (this.selectedMonth() === 11) {
      this.finance.setSelectedYear(this.selectedYear() + 1);
      this.finance.setSelectedMonth(0);
    } else {
      this.finance.setSelectedMonth(this.selectedMonth() + 1);
    }
  }

  toggleTheme(): void {
    const next = this.isDarkTheme() ? 'light' : 'dark';
    this.settings.setTheme(next);
    this.document.documentElement.setAttribute('data-theme', next);
  }
}
