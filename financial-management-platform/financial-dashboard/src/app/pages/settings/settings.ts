import { Component, inject, signal, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { FinanceService } from '../../services/finance.service';
import { SettingsService } from '../../services/settings.service';
import { ConfirmationService } from '../../services/confirmation.service';
import { ToEurPipe } from '../../pipes/to-eur.pipe';

@Component({
  selector: 'app-settings',
  imports: [FormsModule, NgIf, NgFor, DecimalPipe, ToEurPipe],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  private finance = inject(FinanceService);
  readonly settingsService = inject(SettingsService);
  private cdr = inject(ChangeDetectorRef);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  readonly categoryTemplate = this.finance.categoryTemplate;

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

    this.dataSourceLoading.set(true);
    this.dataSourceError.set('');

    try {
      await this.settingsService.setDataSource(value);

      if (value === 'remote') {
        await this.finance.loadFromApi();
      } else {
        this.finance.loadFromLocal();
      }
    } catch {
      if (value === 'remote') {
        // Roll back setting
        await this.settingsService.setDataSource('local').catch(() => {});
        const goToSettings = await this.confirmationService.confirm({
          title: 'API Unavailable',
          message: 'The remote API is not available right now. Switched back to local. Check your connection and try again.',
          confirmLabel: 'OK',
          cancelLabel: '',
        });
        void goToSettings;
      } else {
        this.dataSourceError.set('Failed to switch to local mode.');
      }
    } finally {
      this.dataSourceLoading.set(false);
    }
  }
}
