import { Component, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FinanceService } from '../../services/finance.service';
import { CategorySummary, ChartSegment, IncomeRecord } from '../../models/finance.model';
import { ToEurPipe } from '../../pipes/to-eur.pipe';
import { ConfirmationService } from '../../services/confirmation.service';

@Component({
  selector: 'app-budget',
  imports: [FormsModule, DecimalPipe, DatePipe, ToEurPipe],
  templateUrl: './budget.html',
  styleUrl: './budget.scss',
})
export class Budget {
  private finance = inject(FinanceService);
  private confirmation = inject(ConfirmationService);

  newIncomeAmount = 0;
  eurRateInput = this.finance.eurRate();
  selectedMonth = signal(new Date().getMonth());
  selectedYear = signal(new Date().getFullYear());

  // Income records
  readonly incomeRecords = this.finance.incomeRecords;
  readonly income = this.finance.income;

  editingIncomeId: string | null = null;
  editingIncomeAmount = 0;

  readonly monthLabel = computed(() => {
    const d = new Date(this.selectedYear(), this.selectedMonth());
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  readonly summaries = computed<CategorySummary[]>(() =>
    this.finance.getCategorySummaries(this.selectedMonth(), this.selectedYear())
  );

  readonly totalBudget = computed(() =>
    this.summaries().reduce((s, c) => s + c.budgetAmount, 0)
  );

  readonly totalActual = computed(() =>
    this.summaries().reduce((s, c) => s + c.actualAmount, 0)
  );

  readonly totalDifference = computed(() => this.totalBudget() - this.totalActual());

  readonly totalDiffPercent = computed(() =>
    this.totalBudget() > 0 ? (this.totalDifference() / this.totalBudget()) * 100 : 0
  );

  readonly balanceVsBudget = computed(() => this.income() - this.totalBudget());
  readonly balanceVsActual = computed(() => this.income() - this.totalActual());
  readonly predictedDeficit = computed(() => Math.max(this.totalRemaining() - this.balanceVsActual(), 0));

  // Donut chart segments
  readonly chartSegments = computed<ChartSegment[]>(() => {
    const sums = this.summaries().filter(s => s.actualAmount > 0);
    const total = sums.reduce((s, c) => s + c.actualAmount, 0);
    if (total === 0) return [];

    const segments: ChartSegment[] = [];
    let offset = 25; // start from top (12 o'clock)

    for (const s of sums) {
      const pct = (s.actualAmount / total) * 100;
      segments.push({
        category: s.category,
        percentage: pct,
        dashArray: `${pct} ${100 - pct}`,
        dashOffset: offset,
      });
      offset -= pct;
    }
    return segments;
  });

  // Bar chart max value
  readonly barMax = computed(() => {
    const sums = this.summaries();
    let max = 0;
    for (const s of sums) {
      max = Math.max(max, s.budgetAmount, s.actualAmount);
    }
    return max || 1;
  });

  readonly totalRemaining = computed(() =>
    this.summaries().reduce((sum, category) => sum + Math.max(category.budgetAmount - category.actualAmount, 0), 0)
  );

  barWidth(value: number): number {
    return (value / this.barMax()) * 100;
  }
  
  outcomeBarColor(actualAmount: number, budgetAmount: number): string {
    if (budgetAmount <= 0) return '#2196f3';

    const percent = (actualAmount / budgetAmount) * 100;
    if (percent > 100) return '#f44336';
    if (percent === 100) return '#4caf50';
    if (percent >= 80) return '#ff9800';
    return '#2196f3';
  }

  addIncome(): void {
    if (!this.newIncomeAmount || this.newIncomeAmount <= 0) return;
    this.finance.addIncomeRecord(this.newIncomeAmount);
    this.newIncomeAmount = 0;
  }

  startEditIncome(record: IncomeRecord): void {
    this.editingIncomeId = record.id;
    this.editingIncomeAmount = record.amount;
  }

  saveIncomeEdit(): void {
    const rec = this.finance.incomeRecords().find(r => r.id === this.editingIncomeId);
    if (rec && this.editingIncomeAmount > 0) {
      this.finance.updateIncomeRecord({ ...rec, amount: this.editingIncomeAmount });
    }
    this.editingIncomeId = null;
  }

  cancelIncomeEdit(): void {
    this.editingIncomeId = null;
  }

  async deleteIncome(id: string): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: 'Delete income record?',
      message: 'This income record will be permanently deleted. Continue?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });

    if (!confirmed) return;

    this.finance.deleteIncomeRecord(id);
  }

  updateEurRate(): void {
    this.finance.setEurRate(this.eurRateInput);
  }

  updateCategoryBudget(categoryId: string, newBudget: number): void {
    const cat = this.finance.getCategoryById(categoryId);
    if (cat) {
      this.finance.updateCategory({ ...cat, budgetAmount: newBudget });
    }
  }

  editingBudgetId: string | null = null;
  editingBudgetValue = 0;

  startEditBudget(categoryId: string, currentValue: number): void {
    this.editingBudgetId = categoryId;
    this.editingBudgetValue = currentValue;
  }

  saveBudgetEdit(categoryId: string): void {
    this.updateCategoryBudget(categoryId, this.editingBudgetValue);
    this.editingBudgetId = null;
  }

  cancelBudgetEdit(): void {
    this.editingBudgetId = null;
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
