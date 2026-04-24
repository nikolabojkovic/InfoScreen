import { DOCUMENT } from '@angular/common';
import {
  Component, inject, computed, signal, HostListener, ElementRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';
import { FinanceService } from '../../services/finance.service';

@Component({
  selector: 'app-user-menu',
  imports: [NgIf],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.scss',
})
export class UserMenu {
  private auth = inject(AuthService);
  private settings = inject(SettingsService);
  private finance = inject(FinanceService);
  private router = inject(Router);
  private document = inject(DOCUMENT);
  private host = inject(ElementRef);

  readonly isOpen = signal(false);

  readonly fullName = computed(() => this.auth.getFullName() || this.auth.getUsername());
  readonly username = computed(() => this.auth.getUsername());
  readonly initials = computed(() => {
    const name = this.fullName();
    const parts = name.trim().split(/\s+/);
    return parts[0]?.[0]?.toUpperCase() ?? '?';
  });

  readonly isDarkTheme = computed(() => this.settings.theme() === 'dark');

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isOpen.set(false);
  }

  toggleTheme(): void {
    const next = this.isDarkTheme() ? 'light' : 'dark';
    this.settings.setTheme(next);
    this.document.documentElement.setAttribute('data-theme', next);
  }

  logout(): void {
    this.isOpen.set(false);
    this.auth.logout();
    this.finance.clearStore();
    this.router.navigate(['/login']);
  }
}
