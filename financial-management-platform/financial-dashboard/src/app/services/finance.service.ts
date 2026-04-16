import { Injectable, signal, computed } from '@angular/core';
import { Category, Transaction, CategorySummary, IncomeRecord } from '../models/finance.model';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly STORAGE_CATEGORIES = 'fin_categories';
  private readonly STORAGE_TRANSACTIONS = 'fin_transactions';
  private readonly STORAGE_INCOME = 'fin_income';
  private readonly STORAGE_INCOME_RECORDS = 'fin_income_records';
  private readonly STORAGE_EUR_RATE = 'fin_eur_rate';

  private _categories = signal<Category[]>(this.load(this.STORAGE_CATEGORIES, this.defaultCategories()));
  private _transactions = signal<Transaction[]>(this.load(this.STORAGE_TRANSACTIONS, []));
  private _incomeRecords = signal<IncomeRecord[]>(this.migrateIncomeRecords());
  private _eurRate = signal<number>(this.load(this.STORAGE_EUR_RATE, 117.0));

  readonly categories = this._categories.asReadonly();
  readonly transactions = this._transactions.asReadonly();
  readonly incomeRecords = this._incomeRecords.asReadonly();
  readonly eurRate = this._eurRate.asReadonly();

  readonly income = computed(() =>
    this._incomeRecords().reduce((sum, r) => sum + r.amount, 0)
  );

  readonly totalExpenses = computed(() =>
    this._transactions().reduce((sum, t) => sum + t.amount, 0)
  );

  readonly totalBudget = computed(() =>
    this._categories().reduce((sum, c) => sum + c.budgetAmount, 0)
  );

  readonly balance = computed(() => this.income() - this.totalExpenses());

  // Category CRUD
  addCategory(cat: Omit<Category, 'id'>): void {
    this._categories.update(list => [...list, { ...cat, id: this.genId() }]);
    this.save(this.STORAGE_CATEGORIES, this._categories());
  }

  updateCategory(cat: Category): void {
    this._categories.update(list => list.map(c => c.id === cat.id ? cat : c));
    this.save(this.STORAGE_CATEGORIES, this._categories());
  }

  deleteCategory(id: string): void {
    this._categories.update(list => list.filter(c => c.id !== id));
    this._transactions.update(list => list.filter(t => t.categoryId !== id));
    this.save(this.STORAGE_CATEGORIES, this._categories());
    this.save(this.STORAGE_TRANSACTIONS, this._transactions());
  }

  // Transaction CRUD
  addTransaction(tx: Omit<Transaction, 'id'>): void {
    this._transactions.update(list => [...list, { ...tx, id: this.genId() }]);
    this.save(this.STORAGE_TRANSACTIONS, this._transactions());
  }

  deleteTransaction(id: string): void {
    this._transactions.update(list => list.filter(t => t.id !== id));
    this.save(this.STORAGE_TRANSACTIONS, this._transactions());
  }

  updateTransaction(updated: Transaction): void {
    this._transactions.update(list =>
      list.map(t => t.id === updated.id ? updated : t)
    );
    this.save(this.STORAGE_TRANSACTIONS, this._transactions());
  }

  setEurRate(rate: number): void {
    this._eurRate.set(rate);
    this.save(this.STORAGE_EUR_RATE, rate);
  }

  // Income records CRUD
  addIncomeRecord(amount: number): void {
    const record: IncomeRecord = {
      id: this.genId(),
      amount,
      createdAt: new Date().toISOString(),
    };
    this._incomeRecords.update(list => [...list, record]);
    this.save(this.STORAGE_INCOME_RECORDS, this._incomeRecords());
  }

  updateIncomeRecord(updated: IncomeRecord): void {
    this._incomeRecords.update(list =>
      list.map(r => r.id === updated.id ? updated : r)
    );
    this.save(this.STORAGE_INCOME_RECORDS, this._incomeRecords());
  }

  deleteIncomeRecord(id: string): void {
    this._incomeRecords.update(list => list.filter(r => r.id !== id));
    this.save(this.STORAGE_INCOME_RECORDS, this._incomeRecords());
  }

  getCategorySummaries(month: number, year: number): CategorySummary[] {
    const filtered = this._transactions().filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    return this._categories().map(cat => {
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
    return this._transactions().filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }

  getCategoryById(id: string): Category | undefined {
    return this._categories().find(c => c.id === id);
  }

  private load<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private save(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  private genId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }

  private migrateIncomeRecords(): IncomeRecord[] {
    const records = this.load<IncomeRecord[]>(this.STORAGE_INCOME_RECORDS, []);
    if (records.length > 0) return records;
    // Migrate old single-income value if present
    const oldIncome = this.load<number>(this.STORAGE_INCOME, 0);
    if (oldIncome > 0) {
      const migrated: IncomeRecord[] = [{ id: this.genId(), amount: oldIncome, createdAt: new Date().toISOString() }];
      this.save(this.STORAGE_INCOME_RECORDS, migrated);
      return migrated;
    }
    return [];
  }

  private defaultCategories(): Category[] {
    return [
      { id: 'cat1', name: 'Home', color: '#4CAF50', budgetAmount: 0 },
      { id: 'cat2', name: 'Utilities', color: '#FF9800', budgetAmount: 0 },
      { id: 'cat3', name: 'Car', color: '#2196F3', budgetAmount: 0 },
      { id: 'cat4', name: 'Food', color: '#F44336', budgetAmount: 0 },
      { id: 'cat5', name: 'Personal Items', color: '#9C27B0', budgetAmount: 0 },
      { id: 'cat6', name: 'Medical', color: '#00BCD4', budgetAmount: 0 },
      { id: 'cat7', name: 'Entertainment', color: '#E91E63', budgetAmount: 0 },
      { id: 'cat8', name: 'Investment', color: '#607D8B', budgetAmount: 0 },
    ];
  }
}
