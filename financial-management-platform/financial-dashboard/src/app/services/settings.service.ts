import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

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
  dataSource: 'remote',
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  private storageKey(): string {
    const u = this.authService.getUsername();
    return u !== 'guest' ? `${STORAGE_KEY}_${u}` : STORAGE_KEY;
  }

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

  /** Called after login and on app init when remote — loads settings from API and applies them. */
  async loadFromApi(): Promise<void> {
    const remote = await firstValueFrom(this.apiService.getSettings());
    const settings: AppSettings = {
      theme: remote.theme === 'dark' ? 'dark' : 'light',
      sidebarExpanded: remote.sidebarExpanded === true,
      eurRate: typeof remote.eurRate === 'number' && remote.eurRate > 0 ? remote.eurRate : DEFAULTS.eurRate,
      dataSource: remote.dataSource === 'remote' ? 'remote' : 'local',
    };
    this.theme.set(settings.theme);
    this.sidebarExpanded.set(settings.sidebarExpanded);
    this.eurRate.set(settings.eurRate);
    this.dataSource.set(settings.dataSource);
    // After loading from API, persist UI prefs locally (eurRate only if local)
    this.saveLocal(settings, settings.dataSource === 'remote');
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

  /**
   * Changes data source. Always persists to API (both modes).
   * Returns the new source so the caller can reload data appropriately.
   */
  async setDataSource(source: 'local' | 'remote'): Promise<void> {
    this.dataSource.set(source);
    // Always push the change to the API regardless of current/new source
    const settings: AppSettings = {
      theme: this.theme(),
      sidebarExpanded: this.sidebarExpanded(),
      eurRate: this.eurRate(),
      dataSource: source,
    };
    this.saveLocal(settings, source === 'remote');
    try {
      await firstValueFrom(this.apiService.updateSettings(settings));
    } catch { /* ignore */ }
  }

  private load(): AppSettings {
    try {
      const raw = window.localStorage.getItem(this.storageKey());
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
    const settings: AppSettings = {
      theme: this.theme(),
      sidebarExpanded: this.sidebarExpanded(),
      eurRate: this.eurRate(),
      dataSource: this.dataSource(),
    };

    if (this.dataSource() === 'remote') {
      // Remote: theme + sidebar + dataSource → localStorage (fast UI restore on reload)
      // EUR rate → WebAPI only (financial data, not stored locally)
      this.saveLocal({ ...settings, eurRate: 0 }, /* omitEurRate */ true);
      this.apiService.updateSettings(settings).subscribe({ error: () => {} });
    } else {
      // Local: everything → localStorage only
      this.saveLocal(settings, false);
    }
  }

  private saveLocal(settings: AppSettings, omitEurRate = false): void {
    if (typeof window === 'undefined') return;
    const toStore: Partial<AppSettings> = {
      theme: settings.theme,
      sidebarExpanded: settings.sidebarExpanded,
      dataSource: settings.dataSource,
    };
    if (!omitEurRate) {
      toStore.eurRate = settings.eurRate;
    }
    window.localStorage.setItem(this.storageKey(), JSON.stringify(toStore));
  }
}
