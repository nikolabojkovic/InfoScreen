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

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private store = inject(Store);
  private settingsService = inject(SettingsService);
  private readonly STORAGE_CATEGORIES = 'fin_categories';
  private readonly STORAGE_TRANSACTIONS = 'fin_transactions';
  private readonly STORAGE_INCOME_RECORDS = 'fin_income_records';
  private readonly STORAGE_EUR_RATE = 'fin_eur_rate';

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
  addCategory(cat: Omit<Category, 'id'>): void {
    this.store.dispatch(addCategoryAction({ category: { ...cat, id: this.genId() } }));
    this.persistState();
  }

  updateCategory(cat: Category): void {
    this.store.dispatch(updateCategoryAction({ category: cat }));
    this.persistState();
  }

  deleteCategory(id: string): void {
    this.store.dispatch(deleteCategoryAction({ id }));
    this.persistState();
  }

  // Transaction CRUD
  addTransaction(tx: Omit<Transaction, 'id'>): void {
    this.store.dispatch(addTransactionAction({ transaction: { ...tx, id: this.genId() } }));
    this.persistState();
  }

  deleteTransaction(id: string): void {
    this.store.dispatch(deleteTransactionAction({ id }));
    this.persistState();
  }

  updateTransaction(updated: Transaction): void {
    this.store.dispatch(updateTransactionAction({ transaction: updated }));
    this.persistState();
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
  addIncomeRecord(amount: number, description = '', paymentMethod: 'cash' | 'bank' | 'withdrawal' = 'bank'): void {
    const createdAt = new Date(this.selectedYear(), this.selectedMonth(), 1).toISOString();
    const record: IncomeRecord = {
      id: this.genId(),
      amount,
      description,
      paymentMethod,
      createdAt,
    };
    this.store.dispatch(addIncomeRecordAction({ record }));
    this.persistState();
  }

  updateIncomeRecord(updated: IncomeRecord): void {
    this.store.dispatch(updateIncomeRecordAction({ record: updated }));
    this.persistState();
  }

  deleteIncomeRecord(id: string): void {
    this.store.dispatch(deleteIncomeRecordAction({ id }));
    this.persistState();
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
    localStorage.setItem(this.STORAGE_EUR_RATE, JSON.stringify(state.eurRate));
    localStorage.setItem('budget_selected_month', JSON.stringify(state.selectedMonth));
    localStorage.setItem('budget_selected_year', JSON.stringify(state.selectedYear));
  }
}
