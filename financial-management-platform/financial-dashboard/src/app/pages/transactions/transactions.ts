import { Component, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FinanceService } from '../../services/finance.service';
import { TransactionGroup } from '../../models/finance.model';
import { ToEurPipe } from '../../pipes/to-eur.pipe';

@Component({
  selector: 'app-transactions',
  imports: [FormsModule, DecimalPipe, DatePipe, ToEurPipe],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css',
})
export class Transactions {
  private finance = inject(FinanceService);
  readonly categories = this.finance.categories;

  date = new Date().toISOString().substring(0, 10);
  description = '';
  categoryId = '';
  amount: number = 0;

  selectedMonth = signal(new Date().getMonth());
  selectedYear = signal(new Date().getFullYear());

  readonly monthLabel = computed(() => {
    const d = new Date(this.selectedYear(), this.selectedMonth());
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  readonly transactionGroups = computed<TransactionGroup[]>(() => {
    const txns = this.finance.getFilteredTransactions(this.selectedMonth(), this.selectedYear());
    const sorted = [...txns].sort((a, b) => b.date.localeCompare(a.date));

    const groups: Map<string, TransactionGroup> = new Map();
    for (const tx of sorted) {
      if (!groups.has(tx.date)) {
        groups.set(tx.date, { date: tx.date, transactions: [], total: 0 });
      }
      const g = groups.get(tx.date)!;
      g.transactions.push(tx);
      g.total += tx.amount;
    }
    return Array.from(groups.values());
  });

  readonly monthTotal = computed(() =>
    this.transactionGroups().reduce((sum, g) => sum + g.total, 0)
  );

  getCategoryName(id: string): string {
    return this.finance.getCategoryById(id)?.name ?? 'Unknown';
  }

  getCategoryColor(id: string): string {
    return this.finance.getCategoryById(id)?.color ?? '#ccc';
  }

  addTransaction(): void {
    if (!this.description.trim() || !this.categoryId || this.amount <= 0) return;
    this.finance.addTransaction({
      date: this.date,
      description: this.description.trim(),
      categoryId: this.categoryId,
      amount: this.amount,
    });
    this.description = '';
    this.amount = 0;
  }

  deleteTransaction(id: string): void {
    this.finance.deleteTransaction(id);
  }

  prevMonth(): void {
    if (this.selectedMonth() === 0) {
      this.selectedMonth.set(11);
      this.selectedYear.update(y => y - 1);
    } else {
      this.selectedMonth.update(m => m - 1);
    }
  }

  nextMonth(): void {
    if (this.selectedMonth() === 11) {
      this.selectedMonth.set(0);
      this.selectedYear.update(y => y + 1);
    } else {
      this.selectedMonth.update(m => m + 1);
    }
  }
}
