import { Injectable, signal } from '@angular/core';

export interface AppSettings {
  theme: 'light' | 'dark';
  sidebarExpanded: boolean;
  eurRate: number;
  dataSource: 'local' | 'remote';
}

const STORAGE_KEY = 'finance-dashboard-settings';
const LEGACY_THEME_KEY = 'finance-dashboard-theme';

const DEFAULTS: AppSettings = {
  theme: 'light',
  sidebarExpanded: false,
  eurRate: 117,
  dataSource: 'local',
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  readonly theme = signal<'light' | 'dark'>(DEFAULTS.theme);
  readonly sidebarExpanded = signal<boolean>(DEFAULTS.sidebarExpanded);
  readonly eurRate = signal<number>(DEFAULTS.eurRate);
  readonly dataSource = signal<'local' | 'remote'>(DEFAULTS.dataSource);

  constructor() {
    if (typeof window === 'undefined') return;
    const settings = this.load();
    this.theme.set(settings.theme);
    this.sidebarExpanded.set(settings.sidebarExpanded);
    this.eurRate.set(settings.eurRate);
    this.dataSource.set(settings.dataSource);
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

  setDataSource(source: 'local' | 'remote'): void {
    this.dataSource.set(source);
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
            : DEFAULTS.eurRate,
          dataSource: parsed.dataSource === 'remote' ? 'remote' : 'local',
        };
      }
    } catch {}

    // Migrate from legacy keys on first load
    return {
      theme: this.readLegacyTheme(),
      sidebarExpanded: DEFAULTS.sidebarExpanded,
      eurRate: DEFAULTS.eurRate,
      dataSource: DEFAULTS.dataSource,
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

  private save(): void {
    if (typeof window === 'undefined') return;
    const settings: AppSettings = {
      theme: this.theme(),
      sidebarExpanded: this.sidebarExpanded(),
      eurRate: this.eurRate(),
      dataSource: this.dataSource(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }
}
