import { Action, ActionReducer, createReducer, on } from '@ngrx/store';
import { Category, IncomeRecord, Transaction } from '../../models/finance.model';
import {
  addCategory,
  addIncomeRecord,
  addTransaction,
  deleteCategory,
  deleteIncomeRecord,
  deleteTransaction,
  setEurRate,
  setSelectedMonth,
  setSelectedYear,
  updateCategory,
  updateIncomeRecord,
  updateTransaction,
} from './finance.actions';

export const financeFeatureKey = 'finance';
const STORAGE_CATEGORIES = 'fin_categories';
const STORAGE_TRANSACTIONS = 'fin_transactions';
const STORAGE_INCOME = 'fin_income';
const STORAGE_INCOME_RECORDS = 'fin_income_records';
const STORAGE_SELECTED_MONTH = 'budget_selected_month';
const STORAGE_SELECTED_YEAR = 'budget_selected_year';

export interface FinanceState {
  categoriesByMonth: Record<string, Category[]>;
  transactions: Transaction[];
  incomeRecords: IncomeRecord[];
  eurRate: number;
  selectedMonth: number;
  selectedYear: number;
}

export function monthKey(month: number, year: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function defaultCategories(): Category[] {
  return [
    { id: 'cat1', name: 'Home', color: '#4CAF50', budgetAmount: 0, items: [] },
    { id: 'cat2', name: 'Utilities', color: '#FF9800', budgetAmount: 0, items: [] },
    { id: 'cat3', name: 'Car', color: '#2196F3', budgetAmount: 0, items: [] },
    { id: 'cat4', name: 'Food', color: '#F44336', budgetAmount: 0, items: [] },
    { id: 'cat5', name: 'Personal Items', color: '#9C27B0', budgetAmount: 0, items: [] },
    { id: 'cat6', name: 'Medical', color: '#00BCD4', budgetAmount: 0, items: [] },
    { id: 'cat7', name: 'Entertainment', color: '#E91E63', budgetAmount: 0, items: [] },
    { id: 'cat8', name: 'Investment', color: '#607D8B', budgetAmount: 0, items: [] },
  ];
}

function load<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function loadEurRateFromSettings(): number {
  try {
    const raw = localStorage.getItem('finance-dashboard-settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.eurRate === 'number' && parsed.eurRate > 0) return parsed.eurRate;
    }
  } catch {}
  return 117;
}

function migrateIncomeRecords(): IncomeRecord[] {
  const records = load<IncomeRecord[]>(STORAGE_INCOME_RECORDS, []);
  if (records.length > 0) {
    return records.map(record => ({
      ...record,
      description: record.description ?? '',
      paymentMethod: record.paymentMethod ?? 'bank',
    }));
  }

  const oldIncome = load<number>(STORAGE_INCOME, 0);
  if (oldIncome > 0) {
    return [{ id: Date.now().toString(36), amount: oldIncome, description: '', paymentMethod: 'bank', createdAt: new Date().toISOString() }];
  }

  return [];
}

function migrateTransactions(): Transaction[] {
  const transactions = load<Array<Partial<Transaction>>>(STORAGE_TRANSACTIONS, []);
  return transactions
    .filter(transaction => !!transaction.id && !!transaction.date && !!transaction.description && !!transaction.categoryId)
    .map(transaction => ({
      id: transaction.id as string,
      date: transaction.date as string,
      description: transaction.description as string,
      categoryId: transaction.categoryId as string,
      amount: Number(transaction.amount ?? 0),
      paymentMethod: transaction.paymentMethod ?? 'bank',
    }));
}

function migrateCategories(selectedMonth: number, selectedYear: number): Record<string, Category[]> {
  const loaded = load<unknown>(STORAGE_CATEGORIES, defaultCategories());
  const key = monthKey(selectedMonth, selectedYear);

  if (Array.isArray(loaded)) {
    return { [key]: loaded as Category[] };
  }

  if (loaded && typeof loaded === 'object') {
    return loaded as Record<string, Category[]>;
  }

  return { [key]: defaultCategories() };
}

function createInitialState(): FinanceState {
  const selectedMonth = load<number>(STORAGE_SELECTED_MONTH, new Date().getMonth());
  const selectedYear = load<number>(STORAGE_SELECTED_YEAR, new Date().getFullYear());

  return {
    categoriesByMonth: migrateCategories(selectedMonth, selectedYear),
    transactions: migrateTransactions(),
    incomeRecords: migrateIncomeRecords(),
    eurRate: loadEurRateFromSettings(),
    selectedMonth,
    selectedYear,
  };
}

export const initialFinanceState: FinanceState = createInitialState();

function saveState(state: FinanceState): void {
  localStorage.setItem(STORAGE_CATEGORIES, JSON.stringify(state.categoriesByMonth));
  localStorage.setItem(STORAGE_TRANSACTIONS, JSON.stringify(state.transactions));
  localStorage.setItem(STORAGE_INCOME_RECORDS, JSON.stringify(state.incomeRecords));
  localStorage.setItem(STORAGE_SELECTED_MONTH, JSON.stringify(state.selectedMonth));
  localStorage.setItem(STORAGE_SELECTED_YEAR, JSON.stringify(state.selectedYear));
}

function getActiveMonthKey(state: FinanceState): string {
  return monthKey(state.selectedMonth, state.selectedYear);
}

function getActiveCategories(state: FinanceState): Category[] {
  return state.categoriesByMonth[getActiveMonthKey(state)] ?? defaultCategories();
}

function setActiveCategories(state: FinanceState, categories: Category[]): FinanceState {
  const key = getActiveMonthKey(state);
  return {
    ...state,
    categoriesByMonth: {
      ...state.categoriesByMonth,
      [key]: categories,
    },
  };
}

export const financeReducer = createReducer(
  initialFinanceState,
  on(addCategory, (state, { category }) => setActiveCategories(state, [...getActiveCategories(state), category])),
  on(updateCategory, (state, { category }) => ({
    ...setActiveCategories(state, getActiveCategories(state).map(item => item.id === category.id ? category : item)),
  })),
  on(deleteCategory, (state, { id }) => ({
    ...setActiveCategories(state, getActiveCategories(state).filter(category => category.id !== id)),
    transactions: state.transactions.filter(transaction => {
      const date = new Date(transaction.date);
      const isCurrentMonth = date.getMonth() === state.selectedMonth && date.getFullYear() === state.selectedYear;
      return !(isCurrentMonth && transaction.categoryId === id);
    }),
  })),
  on(addTransaction, (state, { transaction }) => ({ ...state, transactions: [...state.transactions, transaction] })),
  on(updateTransaction, (state, { transaction }) => ({
    ...state,
    transactions: state.transactions.map(item => item.id === transaction.id ? transaction : item),
  })),
  on(deleteTransaction, (state, { id }) => ({
    ...state,
    transactions: state.transactions.filter(transaction => transaction.id !== id),
  })),
  on(setEurRate, (state, { rate }) => ({ ...state, eurRate: rate })),
  on(setSelectedMonth, (state, { month }) => ({ ...state, selectedMonth: month })),
  on(setSelectedYear, (state, { year }) => ({ ...state, selectedYear: year })),
  on(addIncomeRecord, (state, { record }) => ({ ...state, incomeRecords: [...state.incomeRecords, record] })),
  on(updateIncomeRecord, (state, { record }) => ({
    ...state,
    incomeRecords: state.incomeRecords.map(item => item.id === record.id ? record : item),
  })),
  on(deleteIncomeRecord, (state, { id }) => ({
    ...state,
    incomeRecords: state.incomeRecords.filter(record => record.id !== id),
  }))
);

export function financeStorageMetaReducer(reducer: ActionReducer<FinanceState>): ActionReducer<FinanceState> {
  return (state: FinanceState | undefined, action: Action): FinanceState => {
    const nextState = reducer(state, action);
    saveState(nextState);
    return nextState;
  };
}