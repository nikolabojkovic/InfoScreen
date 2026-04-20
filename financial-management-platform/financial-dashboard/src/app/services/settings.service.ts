import { Injectable, signal } from '@angular/core';

export interface AppSettings {
  theme: 'light' | 'dark';
  sidebarExpanded: boolean;
  eurRate: number;
}

const STORAGE_KEY = 'finance-dashboard-settings';
const LEGACY_THEME_KEY = 'finance-dashboard-theme';
const LEGACY_EUR_RATE_KEY = 'fin_eur_rate';

const DEFAULTS: AppSettings = {
  theme: 'light',
  sidebarExpanded: false,
  eurRate: 117,
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  readonly theme = signal<'light' | 'dark'>(DEFAULTS.theme);
  readonly sidebarExpanded = signal<boolean>(DEFAULTS.sidebarExpanded);
  readonly eurRate = signal<number>(DEFAULTS.eurRate);

  constructor() {
    if (typeof window === 'undefined') return;
    const settings = this.load();
    this.theme.set(settings.theme);
    this.sidebarExpanded.set(settings.sidebarExpanded);
    this.eurRate.set(settings.eurRate);
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.theme.set(theme);
    this.save();
  }

  setSidebarExpanded(expanded: boolean): void {
    this.sidebarExpanded.set(expanded);
    this.save();
  }

  setEurRate(rate: number): void {
    this.eurRate.set(rate);
    this.save();
  }

  private load(): AppSettings {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        return {
          theme: parsed.theme === 'dark' ? 'dark' : 'light',
          sidebarExpanded: parsed.sidebarExpanded === true,
          eurRate: typeof parsed.eurRate === 'number' && parsed.eurRate > 0
            ? parsed.eurRate
            : this.readLegacyEurRate(),
        };
      }
    } catch {}

    // Migrate from legacy keys on first load
    return {
      theme: this.readLegacyTheme(),
      sidebarExpanded: DEFAULTS.sidebarExpanded,
      eurRate: this.readLegacyEurRate(),
    };
  }

  private readLegacyTheme(): 'light' | 'dark' {
    try {
      const val = window.localStorage.getItem(LEGACY_THEME_KEY);
      return val === 'dark' ? 'dark' : 'light';
    } catch {
      return DEFAULTS.theme;
    }
  }

  private readLegacyEurRate(): number {
    try {
      const raw = window.localStorage.getItem(LEGACY_EUR_RATE_KEY);
      if (raw) {
        const val = JSON.parse(raw);
        if (typeof val === 'number' && val > 0) return val;
      }
    } catch {}
    return DEFAULTS.eurRate;
  }

  private save(): void {
    if (typeof window === 'undefined') return;
    const settings: AppSettings = {
      theme: this.theme(),
      sidebarExpanded: this.sidebarExpanded(),
      eurRate: this.eurRate(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    // Keep legacy EUR rate key in sync so ngrx reducer can still read it on init
    window.localStorage.setItem(LEGACY_EUR_RATE_KEY, JSON.stringify(settings.eurRate));
  }
}
