import { Component, inject, signal, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { FinanceService } from '../../services/finance.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-settings',
  imports: [FormsModule, NgIf],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  private finance = inject(FinanceService);
  readonly settingsService = inject(SettingsService);
  private cdr = inject(ChangeDetectorRef);

  eurRateInput = this.finance.eurRate();
  eurRateEdit = this.finance.eurRate();
  eurRateEditing = false;
  readonly dataSourceLoading = signal(false);
  readonly dataSourceError = signal('');

  startEditEurRate(): void {
    this.eurRateEdit = this.eurRateInput;
    this.eurRateEditing = true;
  }

  cancelEditEurRate(): void {
    this.eurRateEdit = this.eurRateInput;
    this.eurRateEditing = false;
  }

  confirmEditEurRate(): void {
    this.eurRateInput = this.eurRateEdit;
    this.finance.setEurRate(this.eurRateEdit);
    this.eurRateEditing = false;
    this.eurRateInput = this.finance.eurRate();
    this.eurRateEdit = this.finance.eurRate();
    this.cdr.detectChanges();
  }

  async setDataSource(value: 'local' | 'remote'): Promise<void> {
    const previous = this.settingsService.dataSource();
    if (value === previous) return;
    this.settingsService.setDataSource(value);
    if (value === 'remote') {
      this.dataSourceLoading.set(true);
      this.dataSourceError.set('');
      try {
        await this.finance.loadFromApi();
      } catch (e) {
        this.dataSourceError.set('Failed to load data from API. Switched back to local.');
        this.settingsService.setDataSource('local');
      } finally {
        this.dataSourceLoading.set(false);
      }
    }
  }
}
