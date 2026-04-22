import { createFeatureSelector, createSelector } from '@ngrx/store';
import { Category, IncomeRecord, Transaction } from '../../models/finance.model';
import { defaultCategories, financeFeatureKey, FinanceState, monthKey } from './finance.reducer';

export const selectFinanceState = createFeatureSelector<FinanceState>(financeFeatureKey);
export const selectCategories = createSelector(
  selectFinanceState,
  state => state.categoriesByMonth[monthKey(state.selectedMonth, state.selectedYear)] ?? defaultCategories()
);
export const selectTransactions = createSelector(selectFinanceState, state => state.transactions);
export const selectAllIncomeRecords = createSelector(selectFinanceState, state => state.incomeRecords);
export const selectIncomeRecords = createSelector(
  selectFinanceState,
  state => state.incomeRecords.filter(record => {
    const createdAt = new Date(record.createdAt);
    return createdAt.getMonth() === state.selectedMonth && createdAt.getFullYear() === state.selectedYear;
  })
);
export const selectEurRate = createSelector(selectFinanceState, state => state.eurRate);
export const selectSelectedMonth = createSelector(selectFinanceState, state => state.selectedMonth);
export const selectSelectedYear = createSelector(selectFinanceState, state => state.selectedYear);

export const selectTotalIncome = createSelector(selectIncomeRecords, records =>
  records.filter(record => record.paymentMethod !== 'withdrawal').reduce((sum, record) => sum + record.amount, 0)
);

export const selectTotalExpenses = createSelector(selectTransactions, transactions =>
  transactions.reduce((sum, transaction) => sum + transaction.amount, 0)
);

export const selectTotalBudget = createSelector(selectCategories, categories =>
  categories.reduce((sum, category) => sum + category.budgetAmount, 0)
);

export const selectBalance = createSelector(
  selectTotalIncome,
  selectTotalExpenses,
  (income, expenses) => income - expenses
);

export const selectCategoryById = (id: string) => createSelector(selectCategories, categories =>
  categories.find(category => category.id === id)
);

export const selectFilteredTransactions = (month: number, year: number) => createSelector(
  selectTransactions,
  transactions => transactions.filter(transaction => {
    const date = new Date(transaction.createdAt);
    return date.getMonth() === month && date.getFullYear() === year;
  })
);

export const selectCategorySummaries = (month: number, year: number) => createSelector(
  selectCategories,
  selectFilteredTransactions(month, year),
  (categories, transactions) => categories.map(category => {
    const actualAmount = transactions
      .filter(transaction => transaction.categoryId === category.id)
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const difference = category.budgetAmount - actualAmount;
    const differencePercent = category.budgetAmount > 0
      ? (difference / category.budgetAmount) * 100
      : (actualAmount > 0 ? -100 : 0);

    return { category, budgetAmount: category.budgetAmount, actualAmount, difference, differencePercent };
  })
);