export interface Category {
  id: string;
  name: string;
  color: string;
  budgetAmount: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  categoryId: string;
  amount: number;
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
