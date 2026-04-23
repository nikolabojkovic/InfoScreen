import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ApiSettings {
  theme: string;
  sidebarExpanded: boolean;
  eurRate: number;
  dataSource: string;
}

export interface ApiCategoryItem {
  id?: number;
  description: string;
  amount: number;
}

export interface ApiCategory {
  id: number;
  name: string;
  color: string;
  budgetAmount: number;
  userId: number;
  date: string;    // yyyy-MM-dd (first day of selected month)
  items: ApiCategoryItem[];
}

export interface ApiTransaction {
  id: number;
  date: string;        // yyyy-MM-dd (user-selected date for expenses; first day of month for incomes)
  createdAt: string;   // ISO datetime — set server-side
  description: string;
  categoryId: number | null;
  amount: number;
  paymentMethod: string;
  type: string;        // income | expense
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // ── Categories ────────────────────────────────────────────────────────────

  getCategories(month?: number, year?: number): Observable<ApiCategory[]> {
    let params = new HttpParams();
    if (month != null) params = params.set('month', month);
    if (year != null) params = params.set('year', year);
    return this.http.get<ApiCategory[]>(`${this.base}/api/categories`, { params });
  }

  createCategory(data: Omit<ApiCategory, 'id' | 'userId'> & { date?: string }): Observable<ApiCategory> {
    return this.http.post<ApiCategory>(`${this.base}/api/categories`, data);
  }

  updateCategory(id: number, data: Omit<ApiCategory, 'id' | 'userId' | 'date'>): Observable<ApiCategory> {
    return this.http.put<ApiCategory>(`${this.base}/api/categories/${id}`, data);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/categories/${id}`);
  }

  // ── Transactions (expenses) ───────────────────────────────────────────────

  getTransactions(month?: number, year?: number, type?: string): Observable<ApiTransaction[]> {
    let params = new HttpParams();
    if (month != null) params = params.set('month', month);
    if (year != null) params = params.set('year', year);
    if (type) params = params.set('type', type);
    return this.http.get<ApiTransaction[]>(`${this.base}/api/transactions`, { params });
  }

  createTransaction(data: Omit<ApiTransaction, 'id' | 'createdAt'>): Observable<ApiTransaction> {
    return this.http.post<ApiTransaction>(`${this.base}/api/transactions`, data);
  }

  updateTransaction(id: number, data: Omit<ApiTransaction, 'id' | 'createdAt'>): Observable<ApiTransaction> {
    return this.http.put<ApiTransaction>(`${this.base}/api/transactions/${id}`, data);
  }

  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/transactions/${id}`);
  }

  // ── Income ────────────────────────────────────────────────────────────────

  getIncomes(month?: number, year?: number): Observable<ApiTransaction[]> {
    return this.getTransactions(month, year, 'income');
  }

  createIncome(data: { date: string; description: string; amount: number; paymentMethod: string }): Observable<ApiTransaction> {
    return this.http.post<ApiTransaction>(`${this.base}/api/incomes`, data);
  }

  updateIncome(id: number, data: { date: string; description: string; amount: number; paymentMethod: string }): Observable<ApiTransaction> {
    return this.http.put<ApiTransaction>(`${this.base}/api/incomes/${id}`, data);
  }

  deleteIncome(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/incomes/${id}`);
  }

  // ── Settings ──────────────────────────────────────────────────────────────

  getSettings(): Observable<ApiSettings> {
    return this.http.get<ApiSettings>(`${this.base}/api/settings`);
  }

  updateSettings(data: ApiSettings): Observable<ApiSettings> {
    return this.http.put<ApiSettings>(`${this.base}/api/settings`, data);
  }
}
