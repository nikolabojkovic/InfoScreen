import { AfterViewInit, Component, ElementRef, HostListener, ViewChild, inject, computed, signal } from '@angular/core';
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
export class Budget implements AfterViewInit {
  private finance = inject(FinanceService);
  private confirmation = inject(ConfirmationService);

  @ViewChild('incomeTableWrap') incomeTableWrap?: ElementRef<HTMLDivElement>;

  newIncomeAmount = 0;
  newIncomeDescription = '';
  newIncomeMethod: 'cash' | 'bank' | 'withdrawal' = 'bank';
  eurRateInput = this.finance.eurRate();
  selectedMonth = this.finance.selectedMonth;
  selectedYear = this.finance.selectedYear;

  readonly incomeRecords = this.finance.incomeRecords;
  readonly income = this.finance.income;

  editingIncomeId: string | null = null;
  editingIncomeAmount = 0;
  editingIncomeDescription = '';
  editingIncomeMethod: 'cash' | 'bank' | 'withdrawal' = 'bank';

  incomeScrollState = {
    left: 0,
    viewport: 0,
    scrollWidth: 0,
  };

  readonly monthLabel = computed(() => {
    const d = new Date(this.selectedYear(), this.selectedMonth());
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  readonly summaries = computed<CategorySummary[]>(() =>
    this.finance.getCategorySummaries(this.selectedMonth(), this.selectedYear())
  );

  readonly monthTransactions = computed(() =>
    this.finance.getFilteredTransactions(this.selectedMonth(), this.selectedYear())
  );

  readonly bankIncome = computed(() =>
    this.incomeRecords().filter(record => record.paymentMethod === 'bank').reduce((sum, record) => sum + record.amount, 0)
  );

  readonly cashIncome = computed(() =>
    this.incomeRecords().filter(record => record.paymentMethod === 'cash').reduce((sum, record) => sum + record.amount, 0)
  );

  readonly withdrawalAmount = computed(() =>
    this.incomeRecords().filter(record => record.paymentMethod === 'withdrawal').reduce((sum, record) => sum + record.amount, 0)
  );

  readonly totalIncomeAmount = computed(() => this.bankIncome() + this.cashIncome());

  readonly totalBudget = computed(() =>
    this.summaries().reduce((sum, category) => sum + category.budgetAmount, 0)
  );

  readonly totalActual = computed(() =>
    this.summaries().reduce((sum, category) => sum + category.actualAmount, 0)
  );

  readonly bankOutcome = computed(() =>
    this.monthTransactions()
      .filter(tx => tx.paymentMethod === 'bank')
      .reduce((sum, tx) => sum + tx.amount, 0)
  );

  readonly cashOutcome = computed(() =>
    this.monthTransactions()
      .filter(tx => tx.paymentMethod === 'cash')
      .reduce((sum, tx) => sum + tx.amount, 0)
  );

  readonly bankBalance = computed(() => this.bankIncome() - this.withdrawalAmount() - this.bankOutcome());
  readonly cashBalance = computed(() => this.cashIncome() + this.withdrawalAmount() - this.cashOutcome());

  readonly availableIncome = computed(() => this.totalIncomeAmount());

  readonly totalDifference = computed(() => this.totalBudget() - this.totalActual());

  readonly totalDiffPercent = computed(() =>
    this.totalBudget() > 0 ? (this.totalDifference() / this.totalBudget()) * 100 : 0
  );

  readonly balanceVsBudget = computed(() => this.availableIncome() - this.totalBudget());
  readonly balanceVsActual = computed(() => this.availableIncome() - this.totalActual());
  readonly totalRemainingOutcomeCard = computed(() => this.totalRemaining());
  readonly negativeRemainingTotal = computed(() =>
    this.summaries()
      .filter(summary => summary.difference < 0)
      .reduce((sum, summary) => sum + summary.difference, 0)
  );
  readonly projectedOverspendRaw = computed(() => this.negativeRemainingTotal());
  readonly projectedOverspend = computed(() => this.projectedOverspendRaw() < 0 ? Math.abs(this.projectedOverspendRaw()) : 0);
  readonly projectedOverBudget = computed(() => this.projectedOverspend() > 0);

  readonly chartSegments = computed<ChartSegment[]>(() => {
    const sums = this.summaries().filter(summary => summary.actualAmount > 0);
    const total = sums.reduce((sum, category) => sum + category.actualAmount, 0);
    if (total === 0) return [];

    const segments: ChartSegment[] = [];
    let offset = 25;

    for (const summary of sums) {
      const percentage = (summary.actualAmount / total) * 100;
      segments.push({
        category: summary.category,
        percentage,
        dashArray: `${percentage} ${100 - percentage}`,
        dashOffset: offset,
      });
      offset -= percentage;
    }

    return segments;
  });

  readonly barMax = computed(() => {
    const sums = this.summaries();
    let max = 0;
    for (const summary of sums) {
      max = Math.max(max, summary.budgetAmount, summary.actualAmount);
    }
    return max || 1;
  });

  readonly totalRemaining = computed(() =>
    this.summaries().reduce((sum, category) => sum + Math.max(category.budgetAmount - category.actualAmount, 0), 0)
  );

  ngAfterViewInit(): void {
    queueMicrotask(() => this.updateIncomeScrollState());
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateIncomeScrollState();
  }

  updateIncomeScrollState(): void {
    const element = this.incomeTableWrap?.nativeElement;
    if (!element) return;

    this.incomeScrollState = {
      left: element.scrollLeft,
      viewport: element.clientWidth,
      scrollWidth: element.scrollWidth,
    };
  }

  get incomeScrollbarVisible(): boolean {
    return this.incomeScrollState.scrollWidth > this.incomeScrollState.viewport + 1;
  }

  get incomeScrollbarThumbWidth(): number {
    if (!this.incomeScrollbarVisible) return 100;
    return Math.max((this.incomeScrollState.viewport / this.incomeScrollState.scrollWidth) * 100, 20);
  }

  get incomeScrollbarThumbLeft(): number {
    if (!this.incomeScrollbarVisible) return 0;
    const maxLeft = this.incomeScrollState.scrollWidth - this.incomeScrollState.viewport;
    if (maxLeft <= 0) return 0;
    return (this.incomeScrollState.left / maxLeft) * (100 - this.incomeScrollbarThumbWidth);
  }

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
    this.finance.addIncomeRecord(this.newIncomeAmount, this.newIncomeDescription.trim(), this.newIncomeMethod);
    this.newIncomeAmount = 0;
    this.newIncomeDescription = '';
    this.newIncomeMethod = 'bank';
  }

  startEditIncome(record: IncomeRecord): void {
    this.editingIncomeId = record.id;
    this.editingIncomeAmount = record.amount;
    this.editingIncomeDescription = record.description ?? '';
    this.editingIncomeMethod = record.paymentMethod ?? 'bank';
  }

  saveIncomeEdit(): void {
    const record = this.finance.incomeRecords().find(item => item.id === this.editingIncomeId);
    if (record && this.editingIncomeAmount > 0) {
      this.finance.updateIncomeRecord({
        ...record,
        amount: this.editingIncomeAmount,
        description: this.editingIncomeDescription.trim(),
        paymentMethod: this.editingIncomeMethod,
      });
    }
    this.editingIncomeId = null;
  }

  cancelIncomeEdit(): void {
    this.editingIncomeId = null;
    this.editingIncomeDescription = '';
    this.editingIncomeMethod = 'bank';
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
    const category = this.finance.getCategoryById(categoryId);
    if (category) {
      this.finance.updateCategory({ ...category, budgetAmount: newBudget });
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
      this.finance.setSelectedMonth(11);
      this.finance.setSelectedYear(this.selectedYear() - 1);
    } else {
      this.finance.setSelectedMonth(this.selectedMonth() - 1);
    }
  }

  nextMonth(): void {
    if (this.selectedMonth() === 11) {
      this.finance.setSelectedMonth(0);
      this.finance.setSelectedYear(this.selectedYear() + 1);
    } else {
      this.finance.setSelectedMonth(this.selectedMonth() + 1);
    }
  }
}
