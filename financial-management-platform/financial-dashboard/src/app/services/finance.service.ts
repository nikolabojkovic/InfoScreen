import { Injectable, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Category, CategoryItem, Transaction, CategorySummary, IncomeRecord } from '../models/finance.model';
import {
  addCategory as addCategoryAction,
  addIncomeRecord as addIncomeRecordAction,
  addTransaction as addTransactionAction,
  deleteCategory as deleteCategoryAction,
  deleteIncomeRecord as deleteIncomeRecordAction,
  deleteTransaction as deleteTransactionAction,
  setEurRate as setEurRateAction,
  setSelectedMonth as setSelectedMonthAction,
  setSelectedYear as setSelectedYearAction,
  updateCategory as updateCategoryAction,
  updateIncomeRecord as updateIncomeRecordAction,
  updateTransaction as updateTransactionAction,
} from '../store/finance/finance.actions';
import {
  selectBalance,
  selectFinanceState,
  selectCategories,
  selectEurRate,
  selectAllIncomeRecords,
  selectIncomeRecords,
  selectSelectedMonth,
  selectSelectedYear,
  selectTotalBudget,
  selectTotalExpenses,
  selectTotalIncome,
  selectTransactions,
} from '../store/finance/finance.selectors';
import { SettingsService } from './settings.service';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private store = inject(Store);
  private settingsService = inject(SettingsService);
  private apiService = inject(ApiService);
  private readonly STORAGE_CATEGORIES = 'fin_categories';
  private readonly STORAGE_TRANSACTIONS = 'fin_transactions';
  private readonly STORAGE_INCOME_RECORDS = 'fin_income_records';
  readonly financeState = this.store.selectSignal(selectFinanceState);
  readonly categories = this.store.selectSignal(selectCategories);
  readonly transactions = this.store.selectSignal(selectTransactions);
  readonly incomeRecords = this.store.selectSignal(selectIncomeRecords);
  readonly allIncomeRecords = this.store.selectSignal(selectAllIncomeRecords);
  readonly eurRate = this.store.selectSignal(selectEurRate);
  readonly selectedMonth = this.store.selectSignal(selectSelectedMonth);
  readonly selectedYear = this.store.selectSignal(selectSelectedYear);
  readonly income = this.store.selectSignal(selectTotalIncome);
  readonly totalExpenses = this.store.selectSignal(selectTotalExpenses);
  readonly totalBudget = this.store.selectSignal(selectTotalBudget);
  readonly balance = this.store.selectSignal(selectBalance);

  // Category CRUD
  async addCategory(cat: Omit<Category, 'id'>): Promise<void> {
    if (this.settingsService.dataSource() === 'remote') {
      const created = await firstValueFrom(this.apiService.createCategory({
        name: cat.name, color: cat.color, budgetAmount: cat.budgetAmount,
        items: cat.items.map(i => ({ description: i.description, amount: i.amount })),
      }));
      this.store.dispatch(addCategoryAction({ category: { ...cat, id: String(created.id) } }));
    } else {
      this.store.dispatch(addCategoryAction({ category: { ...cat, id: this.genId() } }));
      this.persistState();
    }
  }

  async updateCategory(cat: Category): Promise<void> {
    if (this.settingsService.dataSource() === 'remote') {
      await firstValueFrom(this.apiService.updateCategory(Number(cat.id), {
        name: cat.name, color: cat.color, budgetAmount: cat.budgetAmount,
        items: cat.items.map(i => ({ description: i.description, amount: i.amount })),
      }));
    }
    this.store.dispatch(updateCategoryAction({ category: cat }));
    if (this.settingsService.dataSource() === 'local') this.persistState();
  }

  async deleteCategory(id: string): Promise<void> {
    if (this.settingsService.dataSource() === 'remote') {
      await firstValueFrom(this.apiService.deleteCategory(Number(id)));
    }
    this.store.dispatch(deleteCategoryAction({ id }));
    if (this.settingsService.dataSource() === 'local') this.persistState();
  }

  // Transaction CRUD
  async addTransaction(tx: Omit<Transaction, 'id'>): Promise<void> {
    if (this.settingsService.dataSource() === 'remote') {
      const date = new Date(tx.date);
      const created = await firstValueFrom(this.apiService.createTransaction({
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        description: tx.description,
        categoryId: tx.categoryId ? Number(tx.categoryId) : null,
        amount: tx.amount,
        paymentMethod: tx.paymentMethod ?? 'bank',
        type: 'expense',
      }));
      this.store.dispatch(addTransactionAction({ transaction: { ...tx, id: String(created.id) } }));
    } else {
      this.store.dispatch(addTransactionAction({ transaction: { ...tx, id: this.genId() } }));
      this.persistState();
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    if (this.settingsService.dataSource() === 'remote') {
      await firstValueFrom(this.apiService.deleteTransaction(Number(id)));
    }
    this.store.dispatch(deleteTransactionAction({ id }));
    if (this.settingsService.dataSource() === 'local') this.persistState();
  }

  async updateTransaction(updated: Transaction): Promise<void> {
    if (this.settingsService.dataSource() === 'remote') {
      const date = new Date(updated.date);
      await firstValueFrom(this.apiService.updateTransaction(Number(updated.id), {
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        description: updated.description,
        categoryId: updated.categoryId ? Number(updated.categoryId) : null,
        amount: updated.amount,
        paymentMethod: updated.paymentMethod ?? 'bank',
        type: 'expense',
      }));
    }
    this.store.dispatch(updateTransactionAction({ transaction: updated }));
    if (this.settingsService.dataSource() === 'local') this.persistState();
  }

  setEurRate(rate: number): void {
    this.store.dispatch(setEurRateAction({ rate }));
    this.settingsService.setEurRate(rate);
    this.persistState();
  }

  setSelectedMonth(month: number): void {
    this.store.dispatch(setSelectedMonthAction({ month }));
    this.persistState();
  }

  setSelectedYear(year: number): void {
    this.store.dispatch(setSelectedYearAction({ year }));
    this.persistState();
  }

  // Income records CRUD
  async addIncomeRecord(amount: number, description = '', paymentMethod: 'cash' | 'bank' | 'withdrawal' = 'bank'): Promise<void> {
    const createdAt = new Date(this.selectedYear(), this.selectedMonth(), 1).toISOString();
    if (this.settingsService.dataSource() === 'remote') {
      const dateStr = `${this.selectedYear()}-${String(this.selectedMonth() + 1).padStart(2, '0')}-01`;
      const created = await firstValueFrom(this.apiService.createIncome({
        date: dateStr, description, amount, paymentMethod,
      }));
      const record: IncomeRecord = { id: String(created.id), amount, description, paymentMethod, createdAt };
      this.store.dispatch(addIncomeRecordAction({ record }));
    } else {
      const record: IncomeRecord = { id: this.genId(), amount, description, paymentMethod, createdAt };
      this.store.dispatch(addIncomeRecordAction({ record }));
      this.persistState();
    }
  }

  async updateIncomeRecord(updated: IncomeRecord): Promise<void> {
    if (this.settingsService.dataSource() === 'remote') {
      const date = new Date(updated.createdAt);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      await firstValueFrom(this.apiService.updateIncome(Number(updated.id), {
        date: dateStr, description: updated.description, amount: updated.amount,
        paymentMethod: updated.paymentMethod,
      }));
    }
    this.store.dispatch(updateIncomeRecordAction({ record: updated }));
    if (this.settingsService.dataSource() === 'local') this.persistState();
  }

  async deleteIncomeRecord(id: string): Promise<void> {
    if (this.settingsService.dataSource() === 'remote') {
      await firstValueFrom(this.apiService.deleteIncome(Number(id)));
    }
    this.store.dispatch(deleteIncomeRecordAction({ id }));
    if (this.settingsService.dataSource() === 'local') this.persistState();
  }

  // Load all data from API into the store (called when switching to remote mode)
  async loadFromApi(): Promise<void> {
    const month = this.selectedMonth();
    const year = this.selectedYear();

    const [categories, transactions, incomes] = await Promise.all([
      firstValueFrom(this.apiService.getCategories()),
      firstValueFrom(this.apiService.getTransactions(month + 1, year, 'expense')),
      firstValueFrom(this.apiService.getIncomes(month + 1, year)),
    ]);

    // Replace store state: clear first then add
    for (const existing of this.categories()) {
      this.store.dispatch(deleteCategoryAction({ id: existing.id }));
    }
    for (const existing of this.transactions()) {
      this.store.dispatch(deleteTransactionAction({ id: existing.id }));
    }
    for (const existing of this.allIncomeRecords()) {
      this.store.dispatch(deleteIncomeRecordAction({ id: existing.id }));
    }

    for (const c of categories) {
      this.store.dispatch(addCategoryAction({
        category: { id: String(c.id), name: c.name, color: c.color, budgetAmount: c.budgetAmount, items: [] },
      }));
    }

    for (const t of transactions) {
      this.store.dispatch(addTransactionAction({
        transaction: {
          id: String(t.id),
          date: t.date,
          description: t.description,
          categoryId: t.categoryId != null ? String(t.categoryId) : '',
          amount: t.amount,
          paymentMethod: t.paymentMethod as any,
        },
      }));
    }

    for (const i of incomes) {
      this.store.dispatch(addIncomeRecordAction({
        record: {
          id: String(i.id),
          amount: i.amount,
          description: i.description,
          paymentMethod: i.paymentMethod as any,
          createdAt: i.date,
        },
      }));
    }
  }

  getCategorySummaries(month: number, year: number): CategorySummary[] {
    const filtered = this.transactions().filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    return this.categories().map(cat => {
      const actualAmount = filtered
        .filter(t => t.categoryId === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);
      const difference = cat.budgetAmount - actualAmount;
      const differencePercent = cat.budgetAmount > 0
        ? (difference / cat.budgetAmount) * 100
        : (actualAmount > 0 ? -100 : 0);

      return { category: cat, budgetAmount: cat.budgetAmount, actualAmount, difference, differencePercent };
    });
  }

  getFilteredTransactions(month: number, year: number): Transaction[] {
    return this.transactions().filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }

  getCategoryById(id: string): Category | undefined {
    return this.categories().find(c => c.id === id);
  }

  private genId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }

  private persistState(): void {
    const state = this.financeState();
    localStorage.setItem(this.STORAGE_CATEGORIES, JSON.stringify(state.categoriesByMonth));
    localStorage.setItem(this.STORAGE_TRANSACTIONS, JSON.stringify(state.transactions));
    localStorage.setItem(this.STORAGE_INCOME_RECORDS, JSON.stringify(state.incomeRecords));
    localStorage.setItem('budget_selected_month', JSON.stringify(state.selectedMonth));
    localStorage.setItem('budget_selected_year', JSON.stringify(state.selectedYear));
  }
}
