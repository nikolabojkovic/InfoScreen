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
  private settingsService = inject(SettingsService);
  private cdr = inject(ChangeDetectorRef);

  eurRateInput = this.finance.eurRate();
  eurRateEdit = this.finance.eurRate();
  eurRateEditing = false;

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
}
