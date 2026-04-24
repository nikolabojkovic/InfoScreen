import { createAction, props } from '@ngrx/store';
import { Category, IncomeRecord, Transaction } from '../../models/finance.model';

export const addCategory = createAction('[Finance] Add Category', props<{ category: Category }>());
export const updateCategory = createAction('[Finance] Update Category', props<{ category: Category }>());
export const deleteCategory = createAction('[Finance] Delete Category', props<{ id: string }>());
export const reorderCategories = createAction('[Finance] Reorder Categories', props<{ orderedIds: string[] }>());

export const addTransaction = createAction('[Finance] Add Transaction', props<{ transaction: Transaction }>());
export const updateTransaction = createAction('[Finance] Update Transaction', props<{ transaction: Transaction }>());
export const deleteTransaction = createAction('[Finance] Delete Transaction', props<{ id: string }>());

export const setEurRate = createAction('[Finance] Set Eur Rate', props<{ rate: number }>());
export const setSelectedMonth = createAction('[Finance] Set Selected Month', props<{ month: number }>());
export const setSelectedYear = createAction('[Finance] Set Selected Year', props<{ year: number }>());

export const addIncomeRecord = createAction('[Finance] Add Income Record', props<{ record: IncomeRecord }>());
export const updateIncomeRecord = createAction('[Finance] Update Income Record', props<{ record: IncomeRecord }>());
export const deleteIncomeRecord = createAction('[Finance] Delete Income Record', props<{ id: string }>());

export const replaceFinanceData = createAction(
  '[Finance] Replace Finance Data',
  props<{ categoriesByMonth: Record<string, Category[]>; transactions: Transaction[]; incomeRecords: IncomeRecord[] }>()
);