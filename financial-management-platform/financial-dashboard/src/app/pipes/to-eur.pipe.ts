import { Pipe, PipeTransform, inject } from '@angular/core';
import { FinanceService } from '../services/finance.service';

@Pipe({ name: 'toEur', standalone: true })
export class ToEurPipe implements PipeTransform {
  private finance = inject(FinanceService);

  transform(rsdValue: number): string {
    const rate = this.finance.eurRate();
    if (!rate || rate <= 0) return '';
    const eurValue = rsdValue / rate;
    return eurValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
