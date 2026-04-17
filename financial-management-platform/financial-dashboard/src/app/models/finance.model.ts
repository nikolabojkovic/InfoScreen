export interface CategoryItem {
  description: string;
  amount: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  budgetAmount: number;
  items: CategoryItem[];
}

export type TransactionPaymentMethod = 'cash' | 'bank';
export type IncomePaymentMethod = TransactionPaymentMethod | 'withdrawal';
export type PaymentMethod = TransactionPaymentMethod;

export interface Transaction {
  id: string;
  date: string;
  description: string;
  categoryId: string;
  amount: number;
  paymentMethod: TransactionPaymentMethod;
}

export interface CategorySummary {
  category: Category;
  budgetAmount: number;
  actualAmount: number;
  difference: number;
  differencePercent: number;
}

export interface ChartSegment {
  category: Category;
  percentage: number;
  dashArray: string;
  dashOffset: number;
}

export interface TransactionGroup {
  date: string;
  transactions: Transaction[];
  total: number;
}

export interface IncomeRecord {
  id: string;
  amount: number;
  description: string;
  paymentMethod: IncomePaymentMethod;
  createdAt: string; // ISO datetime string
}
