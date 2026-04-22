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
  replaceFinanceData as replaceFinanceDataAction,
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
import { monthKey } from '../store/finance/finance.reducer';
import { SettingsService } from './settings.service';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private store = inject(Store);
  private settingsService = inject(SettingsService);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  private storageKey(base: string): string {
    const u = this.authService.getUsername();
    return u !== 'guest' ? `${base}_${u}` : base;
  }
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
    if (this.settingsService.dataSource() === 'local') this.persistState();
  }

  setSelectedMonth(month: number): void {
    this.store.dispatch(setSelectedMonthAction({ month }));
    this.persistMonthYear();
  }

  setSelectedYear(year: number): void {
    this.store.dispatch(setSelectedYearAction({ year }));
    this.persistMonthYear();
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
    const key = monthKey(month, year);

    const [apiCategories, apiTransactions, apiIncomes] = await Promise.all([
      firstValueFrom(this.apiService.getCategories()),
      firstValueFrom(this.apiService.getTransactions(month + 1, year, 'expense')),
      firstValueFrom(this.apiService.getIncomes(month + 1, year)),
    ]);

    const categoriesByMonth: Record<string, Category[]> = {
      [key]: apiCategories.map(c => ({
        id: String(c.id),
        name: c.name,
        color: c.color,
        budgetAmount: c.budgetAmount,
        items: [],
      })),
    };

    const transactions: Transaction[] = apiTransactions.map(t => ({
      id: String(t.id),
      date: t.date,
      description: t.description,
      categoryId: t.categoryId != null ? String(t.categoryId) : '',
      amount: t.amount,
      paymentMethod: t.paymentMethod as Transaction['paymentMethod'],
    }));

    const incomeRecords: IncomeRecord[] = apiIncomes.map(i => ({
      id: String(i.id),
      amount: i.amount,
      description: i.description,
      paymentMethod: i.paymentMethod as IncomeRecord['paymentMethod'],
      createdAt: i.date,
    }));

    this.store.dispatch(replaceFinanceDataAction({ categoriesByMonth, transactions, incomeRecords }));
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

  /** Clears the store (call on logout so the next user starts with empty state). */
  clearStore(): void {
    this.store.dispatch(replaceFinanceDataAction({ categoriesByMonth: {}, transactions: [], incomeRecords: [] }));
  }

  /** Loads finance data from localStorage into the store (used when switching to local mode). */
  loadFromLocal(): void {
    const categoriesRaw = localStorage.getItem(this.storageKey('fin_categories'));
    const transactionsRaw = localStorage.getItem(this.storageKey('fin_transactions'));
    const incomesRaw = localStorage.getItem(this.storageKey('fin_income_records'));

    let categoriesByMonth: Record<string, Category[]> = {};
    let transactions: Transaction[] = [];
    let incomeRecords: IncomeRecord[] = [];

    if (categoriesRaw) {
      try { categoriesByMonth = JSON.parse(categoriesRaw) as Record<string, Category[]>; } catch {}
    }
    if (transactionsRaw) {
      try { transactions = JSON.parse(transactionsRaw) as Transaction[]; } catch {}
    }
    if (incomesRaw) {
      try { incomeRecords = JSON.parse(incomesRaw) as IncomeRecord[]; } catch {}
    }

    this.store.dispatch(replaceFinanceDataAction({ categoriesByMonth, transactions, incomeRecords }));
  }

  /** Persists only the currently selected month/year (always safe to store). */
  private persistMonthYear(): void {
    const state = this.financeState();
    localStorage.setItem(this.storageKey('budget_selected_month'), JSON.stringify(state.selectedMonth));
    localStorage.setItem(this.storageKey('budget_selected_year'), JSON.stringify(state.selectedYear));
  }

  private persistState(): void {
    const state = this.financeState();
    localStorage.setItem(this.storageKey('fin_categories'), JSON.stringify(state.categoriesByMonth));
    localStorage.setItem(this.storageKey('fin_transactions'), JSON.stringify(state.transactions));
    localStorage.setItem(this.storageKey('fin_income_records'), JSON.stringify(state.incomeRecords));
    localStorage.setItem(this.storageKey('budget_selected_month'), JSON.stringify(state.selectedMonth));
    localStorage.setItem(this.storageKey('budget_selected_year'), JSON.stringify(state.selectedYear));
  }
}
